import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px'
};

// Default center (San Francisco)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

interface EmergencyTransportMapProps {
  transportId?: string;
  patientLocation?: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  height?: string;
}

const EmergencyTransportMap: React.FC<EmergencyTransportMapProps> = ({ 
  transportId,
  patientLocation,
  destinationLocation,
  onLocationUpdate,
  height = '300px'
}) => {
  const [center, setCenter] = useState<{ lat: number; lng: number }>(patientLocation || defaultCenter);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Initialize map
  const onLoad = () => {
    setIsMapLoaded(true);
  };

  // Handle map errors
  const onError = () => {
    setMapError("Error loading Google Maps. Please check your API key.");
  };

  // Update center when patient location changes
  useEffect(() => {
    if (patientLocation) {
      setCenter(patientLocation);
    }
  }, [patientLocation]);

  // Simulate driver movement (in a real app, this would come from a real-time database)
  useEffect(() => {
    if (!transportId || !isMapLoaded || !patientLocation) return;

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
  }, [transportId, isMapLoaded, patientLocation, onLocationUpdate]);

  if (mapError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {mapError}
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        onError={onError}
      >
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={center}
          zoom={14}
          onLoad={onLoad}
        >
          {/* Patient location marker */}
          {patientLocation && (
            <Marker
              position={patientLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                labelOrigin: new google.maps.Point(16, -10),
              }}
              label={{
                text: 'Patient',
                color: '#FF0000',
                fontWeight: 'bold',
              }}
            />
          )}
          
          {/* Destination location marker */}
          {destinationLocation && (
            <Marker
              position={destinationLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                labelOrigin: new google.maps.Point(16, -10),
              }}
              label={{
                text: 'Hospital',
                color: '#0000FF',
                fontWeight: 'bold',
              }}
            />
          )}
          
          {/* Driver location marker */}
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                labelOrigin: new google.maps.Point(16, -10),
              }}
              label={{
                text: 'Ambulance',
                color: '#008800',
                fontWeight: 'bold',
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default EmergencyTransportMap;