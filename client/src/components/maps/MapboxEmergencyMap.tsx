import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Ambulance, MapPin, Navigation, Clock } from 'lucide-react';

// Your Mapbox access token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE_URL || "mapbox://styles/sirius-07/cmef6ik44007201s69ii3er7i";

interface Location {
  lat: number;
  lng: number;
}

interface EmergencyVehicle {
  id: string;
  type: 'ambulance' | 'fire_truck' | 'police' | 'helicopter';
  location: Location;
  status: 'available' | 'en_route' | 'on_scene' | 'returning';
  eta?: string;
  driverName?: string;
  vehicleNumber?: string;
}

interface MapboxEmergencyMapProps {
  userLocation?: Location;
  destination?: Location;
  emergencyType?: 'medical' | 'fire' | 'police' | 'general';
  showRoute?: boolean;
  onLocationSelect?: (location: Location) => void;
  vehicles?: EmergencyVehicle[];
  className?: string;
  height?: string;
}

const MapboxEmergencyMap: React.FC<MapboxEmergencyMapProps> = ({
  userLocation,
  destination,
  emergencyType = 'medical',
  showRoute = true,
  onLocationSelect,
  vehicles = [],
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: userLocation?.lng || -122.4194,
    latitude: userLocation?.lat || 37.7749,
    zoom: 12
  });
  const [selectedVehicle, setSelectedVehicle] = useState<EmergencyVehicle | null>(null);
  const [routeData, setRouteData] = useState<any>(null);

  // Update view when user location changes
  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat
      }));
    }
  }, [userLocation]);

  // Fetch route data when we have both start and end points
  useEffect(() => {
    if (!userLocation || !destination || !showRoute) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          setRouteData(data.routes[0]);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, [userLocation, destination, showRoute]);

  const handleMapClick = useCallback((event: any) => {
    if (onLocationSelect) {
      const { lng, lat } = event.lngLat;
      onLocationSelect({ lat, lng });
    }
  }, [onLocationSelect]);

  const getVehicleIcon = (vehicle: EmergencyVehicle) => {
    switch (vehicle.type) {
      case 'ambulance':
        return <Ambulance className="w-6 h-6 text-red-600" />;
      case 'fire_truck':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">F</div>;
      case 'police':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>;
      case 'helicopter':
        return <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">H</div>;
      default:
        return <Ambulance className="w-6 h-6 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'en_route':
        return 'bg-yellow-500';
      case 'on_scene':
        return 'bg-red-500';
      case 'returning':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            color="blue"
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-blue-600 drop-shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                You
              </div>
            </div>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            color="red"
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-600 drop-shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-1 py-0.5 rounded">
                Hospital
              </div>
            </div>
          </Marker>
        )}

        {/* Emergency Vehicles */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.location.lng}
            latitude={vehicle.location.lat}
            anchor="center"
          >
            <div
              className="relative cursor-pointer transform hover:scale-110 transition-transform"
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="relative">
                {getVehicleIcon(vehicle)}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(vehicle.status)} border-2 border-white`} />
              </div>
            </div>
          </Marker>
        ))}

        {/* Vehicle Info Popup */}
        {selectedVehicle && (
          <Popup
            longitude={selectedVehicle.location.lng}
            latitude={selectedVehicle.location.lat}
            anchor="bottom"
            onClose={() => setSelectedVehicle(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                {getVehicleIcon(selectedVehicle)}
                <h3 className="font-semibold capitalize">
                  {selectedVehicle.type.replace('_', ' ')}
                </h3>
              </div>
              
              {selectedVehicle.vehicleNumber && (
                <p className="text-sm text-gray-600 mb-1">
                  Unit: {selectedVehicle.vehicleNumber}
                </p>
              )}
              
              {selectedVehicle.driverName && (
                <p className="text-sm text-gray-600 mb-1">
                  Driver: {selectedVehicle.driverName}
                </p>
              )}
              
              <div className="flex items-center gap-1 mb-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedVehicle.status)}`} />
                <span className="text-sm capitalize">{selectedVehicle.status.replace('_', ' ')}</span>
              </div>
              
              {selectedVehicle.eta && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {selectedVehicle.eta}</span>
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* Route Layer */}
        {routeData && (
          <div>
            {/* Route would be rendered using Map Layer/Source, but simplified for this example */}
          </div>
        )}
      </Map>

      {/* Emergency Type Indicator */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            emergencyType === 'medical' ? 'bg-red-500' :
            emergencyType === 'fire' ? 'bg-orange-500' :
            emergencyType === 'police' ? 'bg-blue-500' : 'bg-gray-500'
          }`} />
          <span className="text-sm font-medium capitalize">{emergencyType} Emergency</span>
        </div>
      </div>

      {/* Route Info */}
      {routeData && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Route Info</span>
            </div>
            <div className="text-gray-600">
              <p>Distance: {(routeData.distance / 1000).toFixed(1)} km</p>
              <p>Duration: {Math.round(routeData.duration / 60)} min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxEmergencyMap;
