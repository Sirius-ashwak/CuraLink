import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Ambulance, 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  AlertTriangle, 
  Activity,
  Truck,
  Shield,
  Plane,
  Radio,
  Users,
  Target
} from 'lucide-react';

// Professional Mapbox access token from environment variables
const MAPBOX_TOKEN = (import.meta.env as any).VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = (import.meta.env as any).VITE_MAPBOX_STYLE_URL || "mapbox://styles/sirius-07/cmef6ik44007201s69ii3er7i";

interface Location {
  lat: number;
  lng: number;
}

interface EmergencyVehicle {
  id: string;
  type: 'ambulance' | 'fire_truck' | 'police' | 'helicopter';
  location: Location;
  status: 'available' | 'en_route' | 'on_scene' | 'returning' | 'out_of_service';
  eta?: string;
  driverName?: string;
  vehicleNumber?: string;
  speed?: number;
  callSign?: string;
  lastUpdate?: string;
  fuel?: number;
}

interface EmergencyIncident {
  id: string;
  location: Location;
  type: 'medical' | 'fire' | 'accident' | 'cardiac' | 'trauma' | 'respiratory';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedAt: string;
  assignedVehicles?: string[];
  casualties?: number;
  hazmat?: boolean;
}

interface Hospital {
  id: string;
  name: string;
  location: Location;
  capacity: number;
  available_beds: number;
  trauma_center: boolean;
  specialties: string[];
}

interface ProfessionalEmergencyMapProps {
  userLocation?: Location;
  destination?: Location;
  emergencyType?: 'medical' | 'fire' | 'police' | 'general';
  showRoute?: boolean;
  onLocationSelect?: (location: Location) => void;
  vehicles?: EmergencyVehicle[];
  incidents?: EmergencyIncident[];
  hospitals?: Hospital[];
  className?: string;
  height?: string;
  showTraffic?: boolean;
  show3D?: boolean;
}

// Professional color scheme
const VEHICLE_COLORS = {
  ambulance: '#FF4444',
  fire_truck: '#FF8800',
  police: '#0066CC',
  helicopter: '#9900CC'
};

const STATUS_COLORS = {
  available: '#00CC00',
  en_route: '#FFAA00',
  on_scene: '#FF4444',
  returning: '#0088CC',
  out_of_service: '#888888'
};

const PRIORITY_COLORS = {
  low: '#00AA00',
  medium: '#FFAA00',
  high: '#FF6600',
  critical: '#FF0000'
};

const ProfessionalEmergencyMap: React.FC<ProfessionalEmergencyMapProps> = ({
  userLocation,
  destination,
  emergencyType = 'medical',
  showRoute = true,
  onLocationSelect,
  vehicles = [],
  incidents = [],
  hospitals = [],
  className = '',
  height = '600px',
  showTraffic = true,
  show3D = false
}) => {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: userLocation?.lng || -122.4194,
    latitude: userLocation?.lat || 37.7749,
    zoom: 13,
    pitch: show3D ? 45 : 0,
    bearing: 0
  });

  const [selectedVehicle, setSelectedVehicle] = useState<EmergencyVehicle | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_STYLE);

  // Sample professional emergency data
  const [liveVehicles, setLiveVehicles] = useState<EmergencyVehicle[]>([
    {
      id: 'AMB-001',
      type: 'ambulance',
      location: { lat: 37.7849, lng: -122.4094 },
      status: 'en_route',
      eta: '4 min',
      driverName: 'Sarah Martinez',
      vehicleNumber: 'Unit 12',
      speed: 45,
      callSign: 'Medic 12',
      lastUpdate: '30 sec ago',
      fuel: 85
    },
    {
      id: 'AMB-002',
      type: 'ambulance',
      location: { lat: 37.7549, lng: -122.4394 },
      status: 'available',
      eta: '2 min',
      driverName: 'Mike Johnson',
      vehicleNumber: 'Unit 15',
      speed: 0,
      callSign: 'Medic 15',
      lastUpdate: '15 sec ago',
      fuel: 92
    },
    {
      id: 'FIRE-001',
      type: 'fire_truck',
      location: { lat: 37.7649, lng: -122.4294 },
      status: 'returning',
      eta: '8 min',
      driverName: 'Robert Chen',
      vehicleNumber: 'Engine 7',
      speed: 35,
      callSign: 'Engine 7',
      lastUpdate: '45 sec ago',
      fuel: 70
    },
    {
      id: 'POL-001',
      type: 'police',
      location: { lat: 37.7749, lng: -122.4094 },
      status: 'on_scene',
      eta: 'On scene',
      driverName: 'Officer Davis',
      vehicleNumber: 'Unit 24',
      speed: 0,
      callSign: 'Adam 24',
      lastUpdate: '10 sec ago',
      fuel: 65
    },
    {
      id: 'HELI-001',
      type: 'helicopter',
      location: { lat: 37.7949, lng: -122.4494 },
      status: 'en_route',
      eta: '6 min',
      driverName: 'Pilot Thompson',
      vehicleNumber: 'Air 1',
      speed: 120,
      callSign: 'Air Rescue 1',
      lastUpdate: '20 sec ago',
      fuel: 78
    }
  ]);

  const [liveIncidents, setLiveIncidents] = useState<EmergencyIncident[]>([
    {
      id: 'INC-001',
      location: { lat: 37.7849, lng: -122.4194 },
      type: 'cardiac',
      priority: 'critical',
      description: 'Cardiac arrest - 65 y/o male',
      reportedAt: '14:23',
      assignedVehicles: ['AMB-001', 'HELI-001'],
      casualties: 1,
      hazmat: false
    },
    {
      id: 'INC-002',
      location: { lat: 37.7649, lng: -122.4394 },
      type: 'accident',
      priority: 'high',
      description: 'Multi-vehicle collision - I-80',
      reportedAt: '14:15',
      assignedVehicles: ['AMB-002', 'POL-001', 'FIRE-001'],
      casualties: 3,
      hazmat: false
    },
    {
      id: 'INC-003',
      location: { lat: 37.7549, lng: -122.4094 },
      type: 'medical',
      priority: 'medium',
      description: 'Chest pain - 45 y/o female',
      reportedAt: '14:30',
      assignedVehicles: [],
      casualties: 1,
      hazmat: false
    }
  ]);

  const [nearbyHospitals] = useState<Hospital[]>([
    {
      id: 'HOSP-001',
      name: 'SF General Hospital',
      location: { lat: 37.7562, lng: -122.4095 },
      capacity: 450,
      available_beds: 23,
      trauma_center: true,
      specialties: ['Emergency', 'Trauma', 'Cardiology', 'Neurology']
    },
    {
      id: 'HOSP-002',
      name: 'UCSF Medical Center',
      location: { lat: 37.7630, lng: -122.4583 },
      capacity: 600,
      available_beds: 15,
      trauma_center: true,
      specialties: ['Emergency', 'Pediatrics', 'Oncology', 'Cardiac Surgery']
    },
    {
      id: 'HOSP-003',
      name: 'St. Mary\'s Medical Center',
      location: { lat: 37.7849, lng: -122.4294 },
      capacity: 300,
      available_beds: 8,
      trauma_center: false,
      specialties: ['Emergency', 'Internal Medicine', 'Surgery']
    }
  ]);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVehicles(prev => prev.map(vehicle => {
        if (vehicle.status === 'en_route') {
          // Simulate movement towards destination
          const newLat = vehicle.location.lat + (Math.random() - 0.5) * 0.001;
          const newLng = vehicle.location.lng + (Math.random() - 0.5) * 0.001;
          return {
            ...vehicle,
            location: { lat: newLat, lng: newLng },
            lastUpdate: 'Just now'
          };
        }
        return { ...vehicle, lastUpdate: `${Math.floor(Math.random() * 60)} sec ago` };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Vehicle icon component
  const VehicleIcon = ({ vehicle, size = 24 }: { vehicle: EmergencyVehicle; size?: number }) => {
    const IconComponent = {
      ambulance: Ambulance,
      fire_truck: Truck,
      police: Shield,
      helicopter: Plane
    }[vehicle.type];

    return (
      <div 
        className="relative cursor-pointer transform transition-transform hover:scale-110"
        style={{ 
          filter: `drop-shadow(0 0 6px ${VEHICLE_COLORS[vehicle.type]})`
        }}
      >
        {/* Status indicator ring */}
        <div 
          className="absolute -inset-1 rounded-full border-2 animate-pulse"
          style={{ 
            borderColor: STATUS_COLORS[vehicle.status],
            animation: vehicle.status === 'en_route' ? 'pulse 1s infinite' : 'none'
          }}
        />
        
        {/* Vehicle icon */}
        <div 
          className="flex items-center justify-center rounded-full p-2"
          style={{ 
            backgroundColor: VEHICLE_COLORS[vehicle.type],
            width: size * 1.5,
            height: size * 1.5
          }}
        >
          <IconComponent 
            size={size} 
            className="text-white" 
            style={{
              transform: vehicle.status === 'en_route' ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
        
        {/* Call sign label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {vehicle.callSign}
        </div>
      </div>
    );
  };

  // Incident icon component
  const IncidentIcon = ({ incident }: { incident: EmergencyIncident }) => {
    const IconComponent = {
      medical: Activity,
      cardiac: Activity,
      trauma: AlertTriangle,
      accident: AlertTriangle,
      fire: AlertTriangle,
      respiratory: Activity
    }[incident.type] || AlertTriangle;

    return (
      <div 
        className="relative cursor-pointer"
        style={{ 
          filter: `drop-shadow(0 0 8px ${PRIORITY_COLORS[incident.priority]})`
        }}
      >
        <div 
          className="flex items-center justify-center rounded-full p-3 border-4 animate-pulse"
          style={{ 
            backgroundColor: PRIORITY_COLORS[incident.priority],
            borderColor: 'white',
            animation: incident.priority === 'critical' ? 'pulse 0.5s infinite' : 'pulse 2s infinite'
          }}
        >
          <IconComponent size={20} className="text-white" />
        </div>
        
        {/* Priority label */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {incident.priority.toUpperCase()}
        </div>
      </div>
    );
  };

  // Hospital icon component
  const HospitalIcon = ({ hospital }: { hospital: Hospital }) => (
    <div className="relative cursor-pointer">
      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg">
        <div className="text-white font-bold text-sm">H</div>
      </div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        {hospital.available_beds} beds
      </div>
    </div>
  );

  // Traffic layer for realistic view
  const trafficLayer = showTraffic ? {
    id: 'traffic',
    type: 'line' as const,
    source: 'mapbox-traffic-v1',
    'source-layer': 'traffic',
    paint: {
      'line-width': 3,
      'line-color': [
        'case',
        ['==', ['get', 'congestion'], 'low'], '#00FF00',
        ['==', ['get', 'congestion'], 'moderate'], '#FFFF00',
        ['==', ['get', 'congestion'], 'heavy'], '#FF6600',
        ['==', ['get', 'congestion'], 'severe'], '#FF0000',
        '#888888'
      ]
    }
  } : null;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-80 rounded-lg p-3 text-white">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold">Emergency Dispatch</div>
          <div className="flex gap-2">
            <button
              onClick={() => setMapStyle(MAPBOX_STYLE)}
              className={`px-2 py-1 text-xs rounded ${mapStyle === MAPBOX_STYLE ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              Custom
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
              className={`px-2 py-1 text-xs rounded ${mapStyle.includes('dark') ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
              className={`px-2 py-1 text-xs rounded ${mapStyle.includes('satellite') ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
              className={`px-2 py-1 text-xs rounded ${mapStyle.includes('streets') && !mapStyle.includes('satellite') ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              Streets
            </button>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 rounded-lg p-3 text-white">
        <div className="text-sm font-semibold mb-2">Live Status</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Active Units:</span>
            <span className="text-green-400">{liveVehicles.filter(v => v.status !== 'out_of_service').length}</span>
          </div>
          <div className="flex justify-between">
            <span>En Route:</span>
            <span className="text-yellow-400">{liveVehicles.filter(v => v.status === 'en_route').length}</span>
          </div>
          <div className="flex justify-between">
            <span>On Scene:</span>
            <span className="text-red-400">{liveVehicles.filter(v => v.status === 'on_scene').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Critical Calls:</span>
            <span className="text-red-500">{liveIncidents.filter(i => i.priority === 'critical').length}</span>
          </div>
        </div>
      </div>

      {/* Main Map */}
      {!MAPBOX_TOKEN ? (
        // Fallback when Mapbox token is missing
        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center p-8">
            <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Professional Emergency Map Unavailable</h3>
            <p className="text-gray-300 mb-4">
              Advanced emergency mapping requires a Mapbox access token.
            </p>
            <div className="text-sm text-gray-400 bg-gray-800 p-4 rounded mb-4">
              <p className="font-semibold mb-2">To enable this feature:</p>
              <p>1. Sign up at mapbox.com</p>
              <p>2. Get a Mapbox access token</p>
              <p>3. Add VITE_MAPBOX_ACCESS_TOKEN to your .env file</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm max-w-md">
              <div className="bg-red-900 p-3 rounded">
                <div className="flex items-center mb-1">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Critical</span>
                </div>
                <span className="text-red-400 text-lg">{liveIncidents.filter(i => i.priority === 'critical').length}</span>
              </div>
              <div className="bg-blue-900 p-3 rounded">
                <div className="flex items-center mb-1">
                  <Ambulance className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Active Units</span>
                </div>
                <span className="text-blue-400 text-lg">{liveVehicles.filter(v => v.status !== 'out_of_service').length}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          onClick={(e) => {
            if (onLocationSelect) {
              onLocationSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            }
          }}
        >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />
        <ScaleControl position="bottom-left" />

        {/* Traffic Layer */}
        {trafficLayer && (
          <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
            <Layer {...trafficLayer} />
          </Source>
        )}

        {/* Vehicle Markers */}
        {liveVehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.location.lng}
            latitude={vehicle.location.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedVehicle(vehicle);
            }}
          >
            <VehicleIcon vehicle={vehicle} />
          </Marker>
        ))}

        {/* Incident Markers */}
        {liveIncidents.map((incident) => (
          <Marker
            key={incident.id}
            longitude={incident.location.lng}
            latitude={incident.location.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedIncident(incident);
            }}
          >
            <IncidentIcon incident={incident} />
          </Marker>
        ))}

        {/* Hospital Markers */}
        {nearbyHospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            longitude={hospital.location.lng}
            latitude={hospital.location.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedHospital(hospital);
            }}
          >
            <HospitalIcon hospital={hospital} />
          </Marker>
        ))}

        {/* Vehicle Popup */}
        {selectedVehicle && (
          <Popup
            longitude={selectedVehicle.location.lng}
            latitude={selectedVehicle.location.lat}
            anchor="top"
            onClose={() => setSelectedVehicle(null)}
            className="emergency-popup"
          >
            <div className="p-3 min-w-64">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[selectedVehicle.status] }}
                />
                <h3 className="font-semibold text-lg">{selectedVehicle.callSign}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{selectedVehicle.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-medium">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-medium">{selectedVehicle.speed} mph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel:</span>
                  <span className="font-medium">{selectedVehicle.fuel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium text-blue-600">{selectedVehicle.eta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium text-green-600">{selectedVehicle.lastUpdate}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                  <Phone size={14} className="inline mr-1" />
                  Contact
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700">
                  <Navigation size={14} className="inline mr-1" />
                  Track
                </button>
              </div>
            </div>
          </Popup>
        )}

        {/* Incident Popup */}
        {selectedIncident && (
          <Popup
            longitude={selectedIncident.location.lng}
            latitude={selectedIncident.location.lat}
            anchor="top"
            onClose={() => setSelectedIncident(null)}
            className="emergency-popup"
          >
            <div className="p-3 min-w-64">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[selectedIncident.priority] }}
                />
                <h3 className="font-semibold text-lg">Incident {selectedIncident.id}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{selectedIncident.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span 
                    className="font-medium capitalize px-2 py-1 rounded text-white text-xs"
                    style={{ backgroundColor: PRIORITY_COLORS[selectedIncident.priority] }}
                  >
                    {selectedIncident.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reported:</span>
                  <span className="font-medium">{selectedIncident.reportedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Casualties:</span>
                  <span className="font-medium">{selectedIncident.casualties}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600">Description:</span>
                  <p className="font-medium mt-1">{selectedIncident.description}</p>
                </div>
                {selectedIncident.assignedVehicles && selectedIncident.assignedVehicles.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-600">Assigned Units:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIncident.assignedVehicles.map(unitId => (
                        <span key={unitId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {unitId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700">
                  <Target size={14} className="inline mr-1" />
                  Dispatch
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700">
                  <Radio size={14} className="inline mr-1" />
                  Update
                </button>
              </div>
            </div>
          </Popup>
        )}

        {/* Hospital Popup */}
        {selectedHospital && (
          <Popup
            longitude={selectedHospital.location.lng}
            latitude={selectedHospital.location.lat}
            anchor="top"
            onClose={() => setSelectedHospital(null)}
            className="emergency-popup"
          >
            <div className="p-3 min-w-64">
              <h3 className="font-semibold text-lg mb-3">{selectedHospital.name}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Beds:</span>
                  <span className={`font-medium ${selectedHospital.available_beds > 10 ? 'text-green-600' : selectedHospital.available_beds > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {selectedHospital.available_beds} / {selectedHospital.capacity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trauma Center:</span>
                  <span className={`font-medium ${selectedHospital.trauma_center ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedHospital.trauma_center ? 'Level I' : 'No'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600">Specialties:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedHospital.specialties.map(specialty => (
                      <span key={specialty} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700">
                  <Phone size={14} className="inline mr-1" />
                  Call
                </button>
                <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                  <Navigation size={14} className="inline mr-1" />
                  Route
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-80 rounded-lg p-3 text-white">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Ambulance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Fire Truck</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>Helicopter</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-700"></div>
            <span>Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalEmergencyMap;
