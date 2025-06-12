import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation } from 'lucide-react';

interface NearbyFacilitiesMapProps {
  onSelectFacility: (facilityName: string, facilityAddress: string) => void;
}

interface Facility {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  type: string;
  specialties: string[];
  waitTime?: string;
  lat: number;
  lng: number;
}

const NearbyFacilitiesMap: React.FC<NearbyFacilitiesMapProps> = ({ onSelectFacility }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to San Francisco coordinates
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Fallback to San Francisco coordinates
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        return;
      }
      
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
    
    function initializeMap() {
      const newMap = new google.maps.Map(mapRef.current!, {
        center: userLocation,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      // Add user marker
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map: newMap,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });
      
      setMap(newMap);
    }
  }, [userLocation]);

  // Query to fetch nearby hospitals
  const nearbyFacilitiesQuery = useQuery({
    queryKey: ['nearbyHospitals', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      
      try {
        const response = await fetch(`/api/maps/nearby-hospitals?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch nearby facilities');
        }
        
        const data = await response.json();
        return data.hospitals || [];
      } catch (error) {
        console.error('Error fetching nearby facilities:', error);
        
        // For demonstration, return mock data when API is not available
        return [
          {
            id: '1',
            name: 'City General Hospital',
            address: '123 Healthcare Ave, San Francisco, CA',
            distance: '1.2 miles',
            rating: 4.5,
            type: 'General Hospital',
            specialties: ['Emergency Care', 'Cardiology', 'Neurology'],
            waitTime: '10 mins',
            lat: userLocation.lat + 0.01,
            lng: userLocation.lng + 0.01
          },
          {
            id: '2',
            name: 'Mercy Medical Center',
            address: '456 Wellness Blvd, San Francisco, CA',
            distance: '2.5 miles',
            rating: 4.8,
            type: 'Specialized Care',
            specialties: ['Cardiac Care', 'Emergency', 'Surgery'],
            waitTime: '5 mins',
            lat: userLocation.lat - 0.01,
            lng: userLocation.lng - 0.01
          },
          {
            id: '3',
            name: 'Community Health Clinic',
            address: '789 Relief Rd, San Francisco, CA',
            distance: '3.0 miles',
            rating: 4.2,
            type: 'Urgent Care',
            specialties: ['Primary Care', 'Urgent Care'],
            waitTime: '15 mins',
            lat: userLocation.lat + 0.02,
            lng: userLocation.lng - 0.01
          }
        ];
      }
    },
    enabled: !!userLocation
  });
  
  // Update markers when facilities data changes
  useEffect(() => {
    if (!map || !nearbyFacilitiesQuery.data) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Create new markers for each facility
    const newMarkers = nearbyFacilitiesQuery.data.map((facility: Facility) => {
      const marker = new google.maps.Marker({
        position: { lat: facility.lat, lng: facility.lng },
        map,
        title: facility.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });
      
      // Add click listener to marker
      marker.addListener('click', () => {
        setSelectedFacility(facility);
      });
      
      return marker;
    });
    
    setMarkers(newMarkers);
  }, [map, nearbyFacilitiesQuery.data]);
  
  // Handle facility selection
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    onSelectFacility(facility.name, facility.address);
    
    // Center map on selected facility
    if (map && facility.lat && facility.lng) {
      map.panTo({ lat: facility.lat, lng: facility.lng });
      map.setZoom(15);
    }
  };

  if (!userLocation) {
    return (
      <Card className="p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p>Getting your location...</p>
      </Card>
    );
  }

  if (nearbyFacilitiesQuery.isLoading) {
    return (
      <Card className="p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p>Finding nearby medical facilities...</p>
      </Card>
    );
  }

  if (nearbyFacilitiesQuery.isError) {
    return (
      <Card className="p-4 text-center">
        <p className="text-red-500">Unable to find nearby facilities</p>
        <Button variant="outline" className="mt-2" onClick={() => nearbyFacilitiesQuery.refetch()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-lg font-medium mb-4">Nearby Medical Facilities</div>
        
        {/* Google Maps Container */}
        <div 
          ref={mapRef} 
          className="w-full h-48 mb-4 rounded-lg border border-gray-200 dark:border-gray-700"
        ></div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {nearbyFacilitiesQuery.data?.map((facility: Facility) => (
            <div 
              key={facility.id} 
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                selectedFacility?.id === facility.id
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => handleSelectFacility(facility)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{facility.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{facility.address}</div>
                  <div className="flex items-center mt-1 text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{facility.distance}</span>
                    
                    {facility.waitTime && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-green-600 dark:text-green-400">Wait: {facility.waitTime}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-blue-600 dark:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFacility(facility);
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NearbyFacilitiesMap;