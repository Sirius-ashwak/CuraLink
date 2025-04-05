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

interface MapViewProps {
  transport: EmergencyTransportWithPatient;
}

const MapView: React.FC<MapViewProps> = ({ transport }) => {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    // Try to parse pickup coordinates first if available
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

    // Fallback to getting current user location if coordinates aren't available
    if (navigator.geolocation) {
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
          setIsMapLoading(false);
        }
      );
    } else {
      setIsMapLoading(false);
    }

    // Fetch driver location updates
    if (transport.status === 'assigned' || transport.status === 'in_progress') {
      const interval = setInterval(() => {
        // This should be replaced with actual WebSocket location updates
        fetch(`/api/emergency-transport/${transport.id}/location`)
          .then(res => res.json())
          .then(data => {
            if (data.location) {
              setDriverLocation(data.location);
            }
          })
          .catch(error => console.error('Error fetching driver location:', error));
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [transport]);

  if (isMapLoading) return <div className="flex justify-center p-6">Loading map...</div>;
  if (!userLocation) return <div className="p-4 text-center">Unable to load map. Location data unavailable.</div>;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap
          center={userLocation}
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
      });

      if (!response.ok) {
        throw new Error('Failed to cancel transport request');
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
        description: 'Failed to cancel transport request. Please try again.',
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
    return <div className="p-4 text-center">Loading transport requests...</div>;
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