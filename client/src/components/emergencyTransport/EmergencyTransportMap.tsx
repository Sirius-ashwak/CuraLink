import React, { useState, useCallback, useEffect } from 'react';

// Map container styles
const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  overflow: 'hidden'
};

// Default center (San Francisco)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

interface Location {
  lat: number;
  lng: number;
}

interface EmergencyTransportMapProps {
  transportId?: string;
  patientLocation?: Location;
  destinationLocation?: Location;
  onLocationUpdate?: (location: Location) => void;
  height?: string;
}

const EmergencyTransportMap: React.FC<EmergencyTransportMapProps> = ({ 
  transportId,
  patientLocation,
  destinationLocation,
  onLocationUpdate,
  height = '300px'
}) => {
  const [center, setCenter] = useState<Location>(patientLocation || defaultCenter);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Simulate driver movement (in a real app, this would come from a real-time database)
  useEffect(() => {
    if (!transportId || !patientLocation) return;

    // Simulate driver location updates
    const interval = setInterval(() => {
      // Generate a location near the patient
      const newLocation = {
        lat: patientLocation.lat + (Math.random() - 0.5) * 0.01,
        lng: patientLocation.lng + (Math.random() - 0.5) * 0.01
      };
      
      setDriverLocation(newLocation);
      
      // Call the callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [transportId, patientLocation, onLocationUpdate]);

  // Update center when patient location changes
  useEffect(() => {
    if (patientLocation) {
      setCenter(patientLocation);
    }
  }, [patientLocation]);

  if (mapError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {mapError}
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <div style={{ 
        ...containerStyle, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        fontSize: '14px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <p className="mb-2">Map visualization available in full version</p>
          <p className="text-xs">
            {patientLocation && destinationLocation ? 
              `Transport route from ${patientLocation.lat.toFixed(4)}, ${patientLocation.lng.toFixed(4)} to destination` : 
              'Location data will be displayed here'}
          </p>
          {driverLocation && (
            <p className="text-xs mt-2 text-green-600">
              Driver is currently {calculateDistance(
                patientLocation?.lat || 0, 
                patientLocation?.lng || 0, 
                driverLocation.lat, 
                driverLocation.lng
              )} away
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance < 1 ? 
    `${Math.round(distance * 1000)}m` : 
    `${distance.toFixed(1)}km`;
}

export default EmergencyTransportMap;