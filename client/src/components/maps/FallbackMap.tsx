import React from 'react';
import { MapPin, Navigation, Ambulance } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface FallbackMapProps {
  patientLocation?: Location;
  destinationLocation?: Location;
  width?: string;
  height?: string;
}

/**
 * A simple fallback map component that displays when Google Maps API is not available
 */
const FallbackMap: React.FC<FallbackMapProps> = ({
  patientLocation,
  destinationLocation,
  width = '100%',
  height = '500px'
}) => {
  return (
    <div 
      style={{ 
        width, 
        height, 
        backgroundColor: '#f0f4f8',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Map background with grid lines */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.3,
          zIndex: 1
        }}
      />
      
      <div style={{ zIndex: 2, textAlign: 'center' }}>
        <h3 className="text-lg font-semibold mb-4">Transport Route Visualization</h3>
        
        {/* Simple route visualization */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {patientLocation && (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-red-500" />
              </div>
              <span className="text-sm mt-1">Pickup</span>
              <span className="text-xs text-gray-500">
                {patientLocation.lat.toFixed(4)}, {patientLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
          
          {patientLocation && destinationLocation && (
            <div className="flex-1 relative h-0.5 bg-blue-300 max-w-[100px]">
              <Ambulance className="h-5 w-5 text-blue-500 absolute -top-2 left-1/2 transform -translate-x-1/2" />
            </div>
          )}
          
          {destinationLocation && (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm mt-1">Destination</span>
              <span className="text-xs text-gray-500">
                {destinationLocation.lat.toFixed(4)}, {destinationLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-gray-500 text-sm">
          This is a simplified map view. For full functionality, please configure the Google Maps API.
        </p>
      </div>
    </div>
  );
};

export default FallbackMap;