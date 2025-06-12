import React, { useState, useEffect } from 'react';
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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Simulated data for demonstration
  useEffect(() => {
    const loadFacilities = () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockFacilities: Facility[] = [
          {
            id: '1',
            name: 'City General Hospital',
            address: '123 Main St, San Francisco, CA 94103',
            distance: '1.2 miles',
            rating: 4.5,
            type: 'General Hospital',
            specialties: ['Emergency Care', 'Cardiology', 'Neurology'],
            waitTime: '10 mins',
            lat: 37.7749,
            lng: -122.4194
          },
          {
            id: '2',
            name: 'Mercy Medical Center',
            address: '456 Market St, San Francisco, CA 94105',
            distance: '2.5 miles',
            rating: 4.8,
            type: 'Specialized Care',
            specialties: ['Cardiac Care', 'Emergency', 'Surgery'],
            waitTime: '5 mins',
            lat: 37.7899,
            lng: -122.4094
          },
          {
            id: '3',
            name: 'Community Health Clinic',
            address: '789 Oak St, San Francisco, CA 94117',
            distance: '3.0 miles',
            rating: 4.2,
            type: 'Urgent Care',
            specialties: ['Primary Care', 'Urgent Care'],
            waitTime: '15 mins',
            lat: 37.7649,
            lng: -122.4294
          },
          {
            id: '4',
            name: 'Children\'s Medical Center',
            address: '101 Pine St, San Francisco, CA 94111',
            distance: '3.5 miles',
            rating: 4.9,
            type: 'Pediatric Hospital',
            specialties: ['Pediatrics', 'Emergency Care'],
            waitTime: '8 mins',
            lat: 37.7549,
            lng: -122.3994
          }
        ];
        
        setFacilities(mockFacilities);
        setIsLoading(false);
      }, 1000);
    };
    
    loadFacilities();
  }, []);

  // Handle facility selection
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    onSelectFacility(facility.name, facility.address);
  };

  if (isLoading) {
    return (
      <Card className="p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p>Finding nearby medical facilities...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
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
          {facilities.map((facility) => (
            <div 
              key={facility.id} 
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                selectedFacility?.id === facility.id
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  : 'hover:bg-gray-50 border-gray-200 dark:hover:bg-gray-800 dark:border-gray-700'
              }`}
              onClick={() => handleSelectFacility(facility)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{facility.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{facility.address}</div>
                  <div className="flex items-center mt-1 text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{facility.distance}</span>
                    
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