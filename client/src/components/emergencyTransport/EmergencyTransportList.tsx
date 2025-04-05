import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ambulance, Clock, MapPin, Info, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { EmergencyTransportWithPatient } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface MapViewProps {
  transport: EmergencyTransportWithPatient;
}

const MapView: React.FC<MapViewProps> = ({ transport }) => {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Default location (San Francisco) for fallback
  const defaultLocation = { lat: 37.7749, lng: -122.4194 };

  useEffect(() => {
    // Try to parse pickup coordinates first if available
    const setInitialLocation = async () => {
      if (transport.pickupCoordinates) {
        try {
          const [lat, lng] = transport.pickupCoordinates.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            setUserLocation({ lat, lng });
            setIsMapLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing pickup coordinates:', error);
        }
      }
      
      // If coordinates aren't available or invalid, try geolocation
      if (navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setIsMapLoading(false);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Fall back to default location
              setUserLocation(defaultLocation);
              setMapError("Could not access your current location. Using default location.");
              setIsMapLoading(false);
            },
            { timeout: 5000, enableHighAccuracy: true }
          );
        } catch (error) {
          console.error('Geolocation error:', error);
          setUserLocation(defaultLocation);
          setMapError("Error accessing location. Using default location.");
          setIsMapLoading(false);
        }
      } else {
        // Geolocation not supported
        setUserLocation(defaultLocation);
        setMapError("Geolocation not supported by your browser. Using default location.");
        setIsMapLoading(false);
      }
    };

    setInitialLocation();

    // Fetch driver location updates if transport is assigned or in progress
    let interval: NodeJS.Timeout | null = null;
    if (transport.status === 'assigned' || transport.status === 'in_progress') {
      // Initial fetch
      fetch(`/api/emergency-transport/${transport.id}/location`)
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setDriverLocation(data.location);
          }
        })
        .catch(error => console.error('Error fetching driver location:', error));

      // Set up interval for updates
      interval = setInterval(() => {
        fetch(`/api/emergency-transport/${transport.id}/location`)
          .then(res => res.json())
          .then(data => {
            if (data.location) {
              setDriverLocation(data.location);
            }
          })
          .catch(error => console.error('Error fetching driver location:', error));
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transport]);

  if (isMapLoading) return (
    <LoadingScreen
      type="minimal"
      variant="emergency"
      message="Loading map"
      showMascot={false}
      showSpinner={true}
      className="p-6"
    />
  );

  return (
    <div className="space-y-2">
      {mapError && (
        <div className="text-sm text-orange-500 dark:text-orange-400 p-2 bg-orange-50 dark:bg-orange-950 rounded-md mb-2">
          {mapError}
        </div>
      )}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
          <GoogleMap
            center={userLocation || defaultLocation}
            zoom={14}
            mapContainerStyle={{ width: '100%', height: '300px' }}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              ]
            }}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                title="Your Location"
              />
            )}
            {driverLocation && (
              <Marker
                position={driverLocation}
                title="Ambulance Location"
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default function EmergencyTransportList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: transportRequests, isLoading, error } = useQuery<EmergencyTransportWithPatient[]>({
    queryKey: ['/api/emergency-transport', user?.id],
    enabled: !!user?.id,
  });

  const cancelTransport = async (id: number) => {
    try {
      const response = await fetch(`/api/emergency-transport/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cancel transport error:', errorData);
        throw new Error(errorData.message || 'Failed to cancel transport request');
      }

      // Update the data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

      toast({
        title: 'Transport Canceled',
        description: 'Your emergency transport request has been canceled.',
      });
    } catch (error) {
      console.error('Cancel transport error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel transport request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Requested</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Driver Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <LoadingScreen
        type="minimal"
        variant="emergency"
        message="Loading transport requests"
        showMascot={true}
        className="p-4"
      />
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading transport requests</div>;
  }

  if (!transportRequests || transportRequests.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Emergency Transports</CardTitle>
          <CardDescription>You have no emergency transport requests</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ambulance className="mr-2" /> Emergency Transports
          </CardTitle>
          <CardDescription>Your emergency transport requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transportRequests.map((transport) => (
              <Card key={transport.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === transport.id ? null : transport.id)}
                >
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
                    <div className="flex items-center">
                      {getStatusBadge(transport.status)}
                      <span className="ml-3 font-medium truncate max-w-[200px]">{transport.reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock size={16} className="mr-1" />
                        {format(new Date(transport.requestDate), isMobile ? 'MMM d, h:mm a' : 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="ml-2">
                        {expandedId === transport.id ? 
                          <ChevronUp size={16} className="text-muted-foreground" /> : 
                          <ChevronDown size={16} className="text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedId === transport.id && (
                  <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center">
                          <MapPin size={16} className="mr-1" /> Pickup Location
                        </h4>
                        <p className="text-sm mt-1">{transport.pickupLocation}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold flex items-center">
                          <MapPin size={16} className="mr-1" /> Destination
                        </h4>
                        <p className="text-sm mt-1">{transport.destination}</p>
                      </div>
                      
                      {transport.notes && (
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-sm font-semibold flex items-center">
                            <Info size={16} className="mr-1" /> Notes
                          </h4>
                          <p className="text-sm mt-1">{transport.notes}</p>
                        </div>
                      )}

                      {(transport.status === 'assigned' || transport.status === 'in_progress') && (
                        <div className="col-span-1 md:col-span-2 mb-4">
                          <h4 className="text-sm font-semibold mb-2">Live Location Tracking</h4>
                          <MapView transport={transport} />
                        </div>
                      )}
                      {transport.driverName && (
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-sm font-semibold">Driver Information</h4>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Name:</span> {transport.driverName}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {transport.driverPhone}
                          </p>
                          {transport.estimatedArrival && (
                            <p className="text-sm">
                              <span className="font-medium">Est. Arrival:</span> {' '}
                              {format(new Date(transport.estimatedArrival), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {transport.status === 'requested' && (
                      <div className="mt-4 flex justify-center md:justify-end">
                        <Button 
                          variant="destructive" 
                          size={isMobile ? "default" : "sm"}
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelTransport(transport.id);
                          }}
                          className="flex items-center w-full md:w-auto"
                        >
                          <X size={16} className="mr-1" /> Cancel Request
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}