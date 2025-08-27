import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ambulance, MapPin, Clock, Phone, Navigation, 
  ShieldAlert, Flame, Car, CheckCircle, XCircle 
} from 'lucide-react';
import LeafletEmergencyMap from '@/components/maps/LeafletEmergencyMap';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css'; // Explicitly import Leaflet CSS

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
  specialization?: string;
}

const EmergencyTransportMapboxDemo: React.FC = () => {
  // Add console log to check Leaflet CSS
  useEffect(() => {
    console.log('Leaflet CSS loaded:', document.querySelector('link[href*="leaflet.css"]') !== null);
  }, []);

  const [userLocation, setUserLocation] = useState<Location>({ lat: 28.6139, lng: 77.2090 }); // New Delhi
  const [destination, setDestination] = useState<Location>({ lat: 28.7041, lng: 77.1025 }); // North Delhi
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<'medical' | 'fire' | 'police' | 'general'>('medical');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'requesting' | 'dispatched' | 'en_route' | 'arrived' | 'failed'>('idle');
  const [assignedVehicle, setAssignedVehicle] = useState<EmergencyVehicle | null>(null);

  // Enhanced emergency vehicles with more details
  const [emergencyVehicles] = useState<EmergencyVehicle[]>([
    {
      id: 'amb_001',
      type: 'ambulance',
      location: { lat: 28.6049, lng: 77.1990 },
      status: 'available',
      eta: '8 min',
      driverName: 'Dr. Rajesh Kumar',
      vehicleNumber: 'DL-AMB-001',
      specialization: 'Cardiac Emergency'
    },
    {
      id: 'amb_002',
      type: 'ambulance',
      location: { lat: 28.6249, lng: 77.2190 },
      status: 'en_route',
      eta: '12 min',
      driverName: 'Dr. Priya Sharma',
      vehicleNumber: 'DL-AMB-002',
      specialization: 'Trauma Care'
    },
    {
      id: 'fire_001',
      type: 'fire_truck',
      location: { lat: 28.5949, lng: 77.1890 },
      status: 'available',
      eta: '6 min',
      driverName: 'Captain Singh',
      vehicleNumber: 'DL-FD-001',
      specialization: 'Fire Fighting'
    },
    {
      id: 'police_001',
      type: 'police',
      location: { lat: 28.6149, lng: 77.2090 },
      status: 'on_scene',
      driverName: 'Inspector Verma',
      vehicleNumber: 'DL-PD-001',
      specialization: 'Law Enforcement'
    },
    {
      id: 'heli_001',
      type: 'helicopter',
      location: { lat: 28.5749, lng: 77.1790 },
      status: 'available',
      eta: '4 min',
      driverName: 'Captain Patel',
      vehicleNumber: 'DL-MED-H1',
      specialization: 'Medical Evacuation'
    }
  ]);

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
          console.error('Location access denied', error);
        }
      );
    }
  }, []);

  const handleEmergencyRequest = () => {
    setRequestStatus('requesting');
    
    const availableVehicles = emergencyVehicles.filter(v => 
      v.status === 'available' && 
      (selectedEmergencyType === 'medical' ? v.type === 'ambulance' : 
       selectedEmergencyType === 'fire' ? v.type === 'fire_truck' :
       selectedEmergencyType === 'police' ? v.type === 'police' : true)
    );
    
    if (availableVehicles.length > 0) {
      const nearestVehicle = availableVehicles[0];
      setAssignedVehicle(nearestVehicle);
      
      setTimeout(() => setRequestStatus('dispatched'), 1000);
      setTimeout(() => setRequestStatus('en_route'), 3000);
      setTimeout(() => setRequestStatus('arrived'), 8000);
    } else {
      setTimeout(() => setRequestStatus('failed'), 2000);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setDestination(location);
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Ambulance className="w-6 h-6 text-red-500" />;
      case 'fire': return <Flame className="w-6 h-6 text-orange-500" />;
      case 'police': return <ShieldAlert className="w-6 h-6 text-blue-500" />;
      default: return <Car className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (requestStatus) {
      case 'idle': return 'Ready to request emergency transport';
      case 'requesting': return 'Processing emergency request...';
      case 'dispatched': return `${assignedVehicle?.vehicleNumber} has been dispatched`;
      case 'en_route': return `${assignedVehicle?.driverName} is en route - ETA: ${assignedVehicle?.eta}`;
      case 'arrived': return 'Emergency vehicle has arrived at your location';
      case 'failed': return 'No available vehicles. Please try again.';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Emergency Request Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 pb-0">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-red-700">
              {getEmergencyIcon(selectedEmergencyType)}
              Emergency Transport Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Emergency Type Selection */}
            <div className="flex justify-between gap-2 mb-4">
              {['medical', 'fire', 'police', 'general'].map((type) => (
                <Button
                  key={type}
                  variant={selectedEmergencyType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEmergencyType(type as any)}
                  className="flex-1 flex items-center gap-2"
                >
                  {type === 'medical' && <Ambulance className="w-4 h-4" />}
                  {type === 'fire' && <Flame className="w-4 h-4" />}
                  {type === 'police' && <ShieldAlert className="w-4 h-4" />}
                  {type === 'general' && <Car className="w-4 h-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            {/* Status Display */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={requestStatus}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 mb-4"
              >
                <Badge 
                  variant={
                    requestStatus === 'failed' ? 'destructive' :
                    requestStatus === 'arrived' ? 'default' :
                    'default'
                  }
                >
                  {requestStatus.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">{getStatusMessage()}</span>
              </motion.div>
            </AnimatePresence>

            {/* Emergency Request Button */}
            <Button
              onClick={handleEmergencyRequest}
              disabled={requestStatus !== 'idle'}
              className="w-full"
              variant={requestStatus === 'failed' ? 'destructive' : 'default'}
              size="lg"
            >
              {requestStatus === 'idle' ? (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Request Emergency Transport
                </>
              ) : requestStatus === 'failed' ? (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Retry Request
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 animate-pulse" />
                  Emergency Active
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Assigned Vehicle Card */}
        <AnimatePresence>
          {assignedVehicle && requestStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-blue-700">
                    <Car className="w-6 h-6" />
                    Assigned Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-600">Unit Number</p>
                    <p className="font-semibold">{assignedVehicle.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-semibold">{assignedVehicle.driverName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold text-blue-600">{assignedVehicle.specialization || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ETA</p>
                    <p className="font-semibold text-red-600">{assignedVehicle.eta}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Interactive Map */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Emergency Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeafletEmergencyMap
            userLocation={userLocation}
            destination={destination}
            emergencyType={selectedEmergencyType}
            showRoute={true}
            onLocationSelect={handleLocationSelect}
            vehicles={emergencyVehicles}
            height="600px"
            className="rounded-lg overflow-hidden border-2 border-gray-200"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyTransportMapboxDemo;
