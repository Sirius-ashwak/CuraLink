import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import SimpleMap from '../maps/SimpleMap';

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
          // Fallback to New York coordinates
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Fallback to New York coordinates
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }
  }, []);

  // Query to fetch nearby hospitals
  const nearbyFacilitiesQuery = useQuery({
    queryKey: ['nearbyHospitals', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      
      try {
        const response = await apiRequest(`/api/facilities/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`);
        
        return response.facilities || [];
      } catch (error) {
        console.error('Error fetching nearby facilities:', error);
        
        // For demonstration, return mock data when API is not available
        return [
          {
            id: '1',
            name: 'City General Hospital',
            address: '123 Healthcare Ave, New York, NY',
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
            address: '456 Wellness Blvd, New York, NY',
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
            address: '789 Relief Rd, New York, NY',
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
  
  // Handle facility selection
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    onSelectFacility(facility.name, facility.address);
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
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {nearbyFacilitiesQuery.data?.map((facility: Facility) => (
            <div 
              key={facility.id} 
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                selectedFacility?.id === facility.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => handleSelectFacility(facility)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{facility.name}</div>
                  <div className="text-sm text-gray-500">{facility.address}</div>
                  <div className="flex items-center mt-1 text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="text-gray-600">{facility.distance}</span>
                    
                    {facility.waitTime && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Wait: {facility.waitTime}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-blue-600"
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