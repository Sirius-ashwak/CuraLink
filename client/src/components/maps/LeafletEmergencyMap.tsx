import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon, Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock } from 'lucide-react';

// Fix for default markers in Leaflet - only import what's needed
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

interface LeafletEmergencyMapProps {
  userLocation?: Location;
  destination?: Location;
  emergencyType?: 'medical' | 'fire' | 'police' | 'general';
  showRoute?: boolean;
  onLocationSelect?: (location: Location) => void;
  vehicles?: EmergencyVehicle[];
  className?: string;
  height?: string;
}

// Optimized map click handler
const MapClickHandler: React.FC<{ onLocationSelect?: (location: Location) => void }> = ({ onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (!onLocationSelect) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
};

// Optimized route display
const RouteDisplay: React.FC<{ 
  userLocation?: Location; 
  destination?: Location; 
  showRoute?: boolean 
}> = ({ userLocation, destination, showRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (!showRoute || !userLocation || !destination) return;

    // Fit map to show both locations with debouncing
    const timeoutId = setTimeout(() => {
      const bounds = L.latLngBounds([userLocation, destination]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }, 100);

    // Draw route line
    const routeLine = L.polyline([userLocation, destination], {
      color: '#3B82F6',
      weight: 3,
      opacity: 0.6,
      dashArray: '8, 4'
    });

    routeLine.addTo(map);

    return () => {
      clearTimeout(timeoutId);
      map.removeLayer(routeLine);
    };
  }, [map, userLocation, destination, showRoute]);

  return null;
};

// Loading fallback component
const MapLoadingFallback: React.FC = () => {
  useEffect(() => {
    console.error('Map failed to load. Checking dependencies...');
    console.log('Leaflet CSS loaded:', document.querySelector('link[href*="leaflet.css"]') !== null);
    console.log('Leaflet object:', L);
    console.log('MapContainer:', MapContainer);
    console.log('TileLayer:', TileLayer);
  }, []);

  return (
    <div className="flex items-center justify-center h-full bg-red-50 rounded-lg p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mx-auto mb-4"></div>
        <p className="text-red-600 font-semibold">Map Loading Failed</p>
        <p className="text-sm text-gray-600 mt-2">
          Please check your internet connection or reload the page.
        </p>
      </div>
    </div>
  );
};

const LeafletEmergencyMap: React.FC<LeafletEmergencyMapProps> = ({
  userLocation,
  destination,
  emergencyType = 'medical',
  showRoute = true,
  onLocationSelect,
  vehicles = [],
  className = '',
  height = '400px'
}) => {
  // Debug logging
  console.log('LeafletEmergencyMap props:', {
    userLocation,
    destination,
    emergencyType,
    showRoute,
    onLocationSelect: !!onLocationSelect,
    vehiclesCount: vehicles.length,
    className,
    height
  });
  const [selectedVehicle, setSelectedVehicle] = useState<EmergencyVehicle | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Memoized vehicle icons to prevent recreation on every render
  const createVehicleIcon = useCallback((type: string, status: string) => {
    const statusColor = 
      status === 'available' ? '#10B981' :
      status === 'en_route' ? '#F59E0B' :
      status === 'on_scene' ? '#EF4444' :
      status === 'returning' ? '#3B82FF' : '#6B7280';

    const iconHtml = `
      <div style="
        background: ${statusColor};
        border: 2px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">
        ${type === 'ambulance' ? '🚑' : 
          type === 'fire_truck' ? '🚒' : 
          type === 'police' ? '🚔' : '🚁'}
      </div>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'custom-vehicle-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);
  
  // Memoize map center to prevent unnecessary re-renders - India centric
  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    return { lat: 23.5937, lng: 78.9629 }; // Center of India
  }, [userLocation]);

  // Memoize status colors
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'en_route': return '#F59E0B';
      case 'on_scene': return '#EF4444';
      case 'returning': return '#3B82F6';
      default: return '#6B7280';
    }
  }, []);

  const getEmergencyTypeColor = useMemo(() => () => {
    switch (emergencyType) {
      case 'medical': return '#EF4444';
      case 'fire': return '#F97316';
      case 'police': return '#3B82F6';
      case 'general': return '#6B7280';
      default: return '#EF4444';
    }
  }, [emergencyType]);

  // Memoize vehicle markers to prevent recreation
  const vehicleMarkers = useMemo(() => 
    vehicles.map((vehicle) => ({
      ...vehicle,
      icon: createVehicleIcon(vehicle.type, vehicle.status)
    })), [vehicles, createVehicleIcon]
  );

  // Optimize marker rendering by limiting visible vehicles
  const visibleVehicles = useMemo(() => {
    if (vehicles.length <= 10) return vehicleMarkers;
    // Only show first 10 vehicles to prevent performance issues
    return vehicleMarkers.slice(0, 10);
  }, [vehicleMarkers, vehicles.length]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Suspense fallback={<MapLoadingFallback />}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          dragging={true}
          touchZoom={true}
          ref={(ref) => {
            if (ref) {
              setIsMapLoaded(true);
            }
          }}
        >
          {/* Use a faster tile server */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
            updateWhenIdle={true}
            updateWhenZooming={false}
            keepBuffer={2}
          />

          {/* Map click handler */}
          <MapClickHandler onLocationSelect={onLocationSelect} />

          {/* Route display */}
          <RouteDisplay 
            userLocation={userLocation} 
            destination={destination} 
            showRoute={showRoute} 
          />

          {/* User Location Marker - only render when exists */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={new Icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              })}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">Your Location</div>
                  <div className="text-sm text-gray-600">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker - only render when exists */}
          {destination && (
            <Marker
              position={destination}
              icon={new Icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              })}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-red-600">Destination</div>
                  <div className="text-sm text-gray-600">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Emergency Vehicles - optimized rendering with limit */}
          {visibleVehicles.map((vehicle, index) => (
            <Marker
              key={vehicle.id || `vehicle-${index}`}
              position={vehicle.location}
              icon={vehicle.icon}
              eventHandlers={{
                click: () => setSelectedVehicle(vehicle)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
                      {vehicle.type === 'ambulance' ? '🚑' : 
                       vehicle.type === 'fire_truck' ? '🚒' : 
                       vehicle.type === 'police' ? '🚔' : '🚁'}
                    </span>
                    <h3 className="font-semibold capitalize text-sm">
                      {vehicle.type.replace('_', ' ')}
                    </h3>
                  </div>
                  
                  {vehicle.vehicleNumber && (
                    <p className="text-xs text-gray-600 mb-1">
                      Unit: {vehicle.vehicleNumber}
                    </p>
                  )}
                  
                  {vehicle.driverName && (
                    <p className="text-xs text-gray-600 mb-1">
                      Driver: {vehicle.driverName}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getStatusColor(vehicle.status) }}
                    />
                    <span className="text-xs capitalize">{vehicle.status.replace('_', ' ')}</span>
                  </div>
                  
                  {vehicle.eta && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Clock className="w-3 h-3" />
                      <span>ETA: {vehicle.eta}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Vehicle Info Popup - only when selected */}
          {selectedVehicle && (
            <Popup
              position={selectedVehicle.location}
              closeButton={true}
            >
              <div className="p-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {selectedVehicle.type === 'ambulance' ? '🚑' : 
                     selectedVehicle.type === 'fire_truck' ? '🚒' : 
                     selectedVehicle.type === 'police' ? '🚔' : '🚁'}
                  </span>
                  <h3 className="font-semibold capitalize text-sm">
                    {selectedVehicle.type.replace('_', ' ')}
                  </h3>
                </div>
                
                {selectedVehicle.vehicleNumber && (
                  <p className="text-xs text-gray-600 mb-1">
                    Unit: {selectedVehicle.vehicleNumber}
                  </p>
                )}
                
                {selectedVehicle.driverName && (
                  <p className="text-xs text-gray-600 mb-1">
                    Driver: {selectedVehicle.driverName}
                  </p>
                )}
                
                <div className="flex items-center gap-1 mb-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getStatusColor(selectedVehicle.status) }}
                  />
                  <span className="text-xs capitalize">{selectedVehicle.status.replace('_', ' ')}</span>
                </div>
                
                {selectedVehicle.eta && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {selectedVehicle.eta}</span>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </MapContainer>
      </Suspense>

      {/* Emergency Type Indicator - simplified */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[1000]">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getEmergencyTypeColor() }}
          />
          <span className="text-sm font-medium capitalize">{emergencyType} Emergency</span>
        </div>
      </div>

      {/* Map Instructions - only when needed */}
      {onLocationSelect && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[1000] max-w-xs">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Click to Select</span>
            </div>
            <p className="text-gray-600 text-xs">
              Click anywhere on the map to set your destination location
            </p>
          </div>
        </div>
      )}

      {/* Performance warning for too many vehicles */}
      {vehicles.length > 10 && (
        <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 z-[1000] max-w-xs">
          <div className="text-xs text-yellow-800">
            <span className="font-medium">Performance Note:</span> Showing first 10 of {vehicles.length} vehicles
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletEmergencyMap;
