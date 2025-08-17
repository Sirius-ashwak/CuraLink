import React, { useState, useEffect } from 'react';
import MapboxEmergencyMap from '../maps/MapboxEmergencyMap';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Ambulance, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle,
  Navigation,
  CheckCircle
} from 'lucide-react';

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

const EmergencyTransportMapboxDemo: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Location>({ lat: 37.7749, lng: -122.4194 });
  const [destination, setDestination] = useState<Location>({ lat: 37.7849, lng: -122.4094 });
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<'medical' | 'fire' | 'police' | 'general'>('medical');
  const [emergencyRequested, setEmergencyRequested] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Sample emergency vehicles data
  const [vehicles, setVehicles] = useState<EmergencyVehicle[]>([
    {
      id: 'amb-001',
      type: 'ambulance',
      location: { lat: 37.7650, lng: -122.4150 },
      status: 'available',
      eta: '5 min',
      driverName: 'John Smith',
      vehicleNumber: 'AMB-001'
    },
    {
      id: 'amb-002',
      type: 'ambulance',
      location: { lat: 37.7850, lng: -122.4250 },
      status: 'en_route',
      eta: '8 min',
      driverName: 'Sarah Johnson',
      vehicleNumber: 'AMB-002'
    },
    {
      id: 'fire-001',
      type: 'fire_truck',
      location: { lat: 37.7700, lng: -122.4100 },
      status: 'available',
      eta: '7 min',
      driverName: 'Mike Wilson',
      vehicleNumber: 'FIRE-001'
    },
    {
      id: 'police-001',
      type: 'police',
      location: { lat: 37.7800, lng: -122.4300 },
      status: 'on_scene',
      driverName: 'Officer Davis',
      vehicleNumber: 'UNIT-12'
    }
  ]);

  // Simulate vehicle movement
  useEffect(() => {
    if (!emergencyRequested) return;

    const interval = setInterval(() => {
      setVehicles(prev => prev.map(vehicle => {
        if (vehicle.status === 'en_route') {
          // Simulate movement towards user location
          const deltaLat = (userLocation.lat - vehicle.location.lat) * 0.1;
          const deltaLng = (userLocation.lng - vehicle.location.lng) * 0.1;
          
          return {
            ...vehicle,
            location: {
              lat: vehicle.location.lat + deltaLat,
              lng: vehicle.location.lng + deltaLng
            }
          };
        }
        return vehicle;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [emergencyRequested, userLocation]);

  const handleRequestEmergency = () => {
    setEmergencyRequested(true);
    
    // Find the nearest available vehicle of the selected type
    const availableVehicles = vehicles.filter(v => 
      v.status === 'available' && 
      (selectedEmergencyType === 'medical' ? v.type === 'ambulance' : 
       selectedEmergencyType === 'fire' ? v.type === 'fire_truck' :
       selectedEmergencyType === 'police' ? v.type === 'police' : true)
    );

    if (availableVehicles.length > 0) {
      const nearestVehicle = availableVehicles[0];
      setSelectedVehicleId(nearestVehicle.id);
      
      // Update vehicle status
      setVehicles(prev => prev.map(v => 
        v.id === nearestVehicle.id 
          ? { ...v, status: 'en_route' as const }
          : v
      ));
    }
  };

  const handleLocationSelect = (location: Location) => {
    if (!emergencyRequested) {
      setUserLocation(location);
    }
  };

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-500 hover:bg-red-600';
      case 'fire': return 'bg-orange-500 hover:bg-orange-600';
      case 'police': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'en_route': return 'bg-yellow-100 text-yellow-800';
      case 'on_scene': return 'bg-red-100 text-red-800';
      case 'returning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Emergency Transport - Mapbox Integration
        </h1>
        <p className="text-gray-600">
          Real-time emergency vehicle tracking powered by Mapbox
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Emergency Response Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapboxEmergencyMap
                userLocation={userLocation}
                destination={destination}
                emergencyType={selectedEmergencyType}
                vehicles={vehicles}
                onLocationSelect={handleLocationSelect}
                height="500px"
                className="rounded-lg overflow-hidden border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Emergency Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['medical', 'fire', 'police', 'general'] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedEmergencyType === type ? "default" : "outline"}
                  className={`w-full justify-start ${
                    selectedEmergencyType === type ? getEmergencyTypeColor(type) : ''
                  }`}
                  onClick={() => setSelectedEmergencyType(type)}
                  disabled={emergencyRequested}
                >
                  {type === 'medical' && <Ambulance className="w-4 h-4 mr-2" />}
                  {type === 'fire' && <AlertTriangle className="w-4 h-4 mr-2" />}
                  {type === 'police' && <Phone className="w-4 h-4 mr-2" />}
                  {type === 'general' && <Navigation className="w-4 h-4 mr-2" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)} Emergency
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Request Emergency Button */}
          <Card>
            <CardContent className="pt-6">
              {!emergencyRequested ? (
                <Button
                  onClick={handleRequestEmergency}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Request Emergency Transport
                </Button>
              ) : (
                <div className="text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="font-medium text-green-700">Emergency Requested</p>
                  <p className="text-sm text-gray-600">Help is on the way</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedVehicleId === vehicle.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {vehicle.type === 'ambulance' && <Ambulance className="w-4 h-4 text-red-600" />}
                      <span className="font-medium">{vehicle.vehicleNumber}</span>
                    </div>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Driver: {vehicle.driverName}</p>
                    {vehicle.eta && (
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA: {vehicle.eta}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click on the map to set your location (before requesting emergency)</li>
                <li>• Select the type of emergency you need</li>
                <li>• Click "Request Emergency Transport" to dispatch the nearest vehicle</li>
                <li>• Watch real-time vehicle tracking on the map</li>
                <li>• Vehicle status updates automatically</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyTransportMapboxDemo;
