import React, { useState, useEffect } from 'react';
import EmergencyTransportMap from './EmergencyTransportMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface Location {
  lat: number;
  lng: number;
}

interface TransportDetails {
  id: string;
  patientId: number;
  patientName: string;
  pickupLocation: Location;
  destination: Location;
  vehicleType: string;
  status: string;
  driverName: string;
  driverPhone: string;
  estimatedArrival: Date | null;
  requestDate: Date;
  notes: string;
}

interface TransportTrackingProps {
  transportId: string;
}

const TransportTracking: React.FC<TransportTrackingProps> = ({ transportId }) => {
  const [transport, setTransport] = useState<TransportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  
  useEffect(() => {
    // Simulate fetching transport details
    const fetchTransportDetails = async () => {
      try {
        // In a real app, this would be a real API call
        // For demo purposes, we'll simulate a response
        setTimeout(() => {
          const mockTransport: TransportDetails = {
            id: transportId,
            patientId: 1,
            patientName: "John Doe",
            pickupLocation: { lat: 37.7749, lng: -122.4194 },
            destination: { lat: 37.7833, lng: -122.4167 },
            vehicleType: "ambulance",
            status: "in_progress",
            driverName: "Michael Wilson",
            driverPhone: "(555) 123-4567",
            estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
            requestDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            notes: "Patient has history of heart problems"
          };
          
          setTransport(mockTransport);
          
          // Calculate ETA in minutes
          if (mockTransport.estimatedArrival) {
            const diffMs = mockTransport.estimatedArrival.getTime() - Date.now();
            setEtaMinutes(Math.round(diffMs / 60000)); // Convert ms to minutes
          }
          
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Error fetching transport data: ", err);
        setError('Failed to load transport data');
        setLoading(false);
      }
    };
    
    fetchTransportDetails();
    
    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      if (etaMinutes !== null && etaMinutes > 0) {
        setEtaMinutes(prev => prev !== null ? prev - 1 : null);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(updateInterval);
  }, [transportId]);

  // Handle location updates from the map
  const handleLocationUpdate = (location: Location) => {
    if (!transport) return;
    
    // In a real app, this would update the database
    // For demo purposes, we'll just update the local state
    
    // Calculate new ETA based on the new location
    const estimatedMinutes = Math.floor(Math.random() * 10) + 5;
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedMinutes);
    
    setTransport(prev => prev ? {
      ...prev,
      estimatedArrival
    } : null);
    
    setEtaMinutes(estimatedMinutes);
  };

  if (loading) {
    return <div className="text-center p-8">Loading transport details...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-800 p-4 rounded-md">{error}</div>;
  }

  if (!transport) {
    return <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">Transport information not available</div>;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b">
        <CardTitle className="flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-full">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </span>
          Emergency Transport Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Status:</span>
              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {transport.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Patient:</span>
              <span className="ml-2">{transport.patientName}</span>
            </div>
            
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Vehicle Type:</span>
              <span className="ml-2 capitalize">{transport.vehicleType.replace('_', ' ')}</span>
            </div>
            
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Driver:</span>
              <span className="ml-2">{transport.driverName}</span>
            </div>
            
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Driver Phone:</span>
              <span className="ml-2">{transport.driverPhone}</span>
            </div>
            
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Requested:</span>
              <span className="ml-2">{transport.requestDate.toLocaleString()}</span>
            </div>
            
            {etaMinutes !== null && (
              <div className="mb-4">
                <span className="text-gray-500 font-medium">ETA:</span>
                <span className="ml-2 font-bold">
                  {etaMinutes <= 0 ? 'Arriving now' : `${etaMinutes} minutes`}
                </span>
              </div>
            )}
            
            {transport.notes && (
              <div className="mb-4">
                <span className="text-gray-500 font-medium">Notes:</span>
                <span className="ml-2">{transport.notes}</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Live Location Tracking</h3>
            <EmergencyTransportMap
              transportId={transport.id}
              patientLocation={transport.pickupLocation}
              destinationLocation={transport.destination}
              onLocationUpdate={handleLocationUpdate}
              height="350px"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransportTracking;