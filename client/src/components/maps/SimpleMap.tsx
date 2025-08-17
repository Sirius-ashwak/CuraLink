import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
}

interface SimpleMapProps {
  center?: Location;
  markers?: Location[];
  width?: string;
  height?: string;
}

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194 // San Francisco
};

const SimpleMap: React.FC<SimpleMapProps> = ({
  center = defaultCenter,
  markers = [],
  width = '100%',
  height = '500px'
}) => {
  // Get API key from environment variables
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: ['places']
  });

  const mapRef = React.useRef<google.maps.Map | null>(null);
  
  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = React.useCallback(function callback() {
    mapRef.current = null;
  }, []);

  if (loadError) {
    console.error("Google Maps loading error:", loadError);
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-semibold mb-2">Error loading maps</h3>
        <p>Error details: {loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 text-center bg-blue-50 rounded">
        <div className="animate-pulse">Loading maps...</div>
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, width, height }}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {markers.map((position, index) => (
          <Marker key={index} position={position} />
        ))}
      </GoogleMap>
    </div>
  );
};

export default SimpleMap;