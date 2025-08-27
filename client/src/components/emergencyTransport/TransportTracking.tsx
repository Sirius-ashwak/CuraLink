import React, { useState, useEffect } from 'react';
import MapboxEmergencyMap from '../maps/MapboxEmergencyMap';
import SimpleMap from '../maps/SimpleMap';
import { firestore } from '../../lib/googleCloud';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';

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
    if (!firestore) {
      setError('Firestore is not configured.');
      setLoading(false);
      
      // Create mock transport data for development
      const mockTransport: TransportDetails = {
        id: transportId,
        patientId: 1,
        patientName: 'Demo Patient',
        pickupLocation: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        destination: { lat: 37.7833, lng: -122.4167 }, // Nearby location
        vehicleType: 'ambulance',
        status: 'in_progress',
        driverName: 'Demo Driver',
        driverPhone: '(555) 123-4567',
        estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        requestDate: new Date(),
        notes: 'This is a demo transport since Firestore is not configured.'
      };
      
      setTransport(mockTransport);
      setEtaMinutes(15);
      return;
    }
    
    const transportRef = doc(firestore, 'emergencyTransports', transportId);
    
    // Set up real-time listener for transport updates
    const unsubscribe = onSnapshot(transportRef, (docSnapshot) => {
      if (!docSnapshot.exists()) {
        setError('Transport request not found');
        setLoading(false);
        return;
      }
      
      const data = docSnapshot.data();
      
      // Convert Firestore timestamps to JS Dates
      let estimatedArrival = null;
      if (data.estimatedArrival) {
        estimatedArrival = data.estimatedArrival instanceof Timestamp 
          ? data.estimatedArrival.toDate() 
          : new Date(data.estimatedArrival);
          
        // Calculate ETA in minutes
        const now = new Date();
        const diffMs = estimatedArrival.getTime() - now.getTime();
        setEtaMinutes(Math.round(diffMs / 60000)); // Convert ms to minutes
      }
      
      const requestDate = data.requestDate instanceof Timestamp 
        ? data.requestDate.toDate() 
        : new Date(data.requestDate);
      
      // Convert string locations to Location objects if necessary
      let pickupLocation = data.pickupLocation;
      let destination = data.destination;
      
      if (typeof pickupLocation === 'string') {
        try {
          // Try to parse from string format (latitude,longitude)
          const [lat, lng] = data.pickupLocation.split(',').map(Number);
          pickupLocation = { lat, lng };
        } catch (e) {
          console.error('Error parsing pickup location:', e);
          pickupLocation = { lat: 0, lng: 0 };
        }
      }
      
      if (typeof destination === 'string') {
        try {
          const [lat, lng] = data.destination.split(',').map(Number);
          destination = { lat, lng };
        } catch (e) {
          console.error('Error parsing destination:', e);
          destination = { lat: 0, lng: 0 };
        }
      }
      
      setTransport({
        id: docSnapshot.id,
        patientId: data.patientId,
        patientName: data.patientName || 'Unknown Patient',
        pickupLocation,
        destination,
        vehicleType: data.vehicleType || 'ambulance',
        status: data.status || 'requested',
        driverName: data.driverName || 'Not assigned',
        driverPhone: data.driverPhone || 'Not assigned',
        estimatedArrival,
        requestDate,
        notes: data.notes || ''
      });
      
      setLoading(false);
    }, (err) => {
      console.error("Error getting transport data: ", err);
      setError('Failed to load transport data');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [transportId]);

  // Handle location updates from the map
  const handleLocationUpdate = async (location: Location) => {
    if (!transport || !firestore) return;
    
    try {
      // Update the estimated arrival time based on the new location
      const transportRef = doc(firestore, 'emergencyTransports', transportId);
      
      // In a real app, you would calculate this based on the distance and speed
      // Here we'll just set it to 5-15 minutes from now as an example
      const estimatedMinutes = Math.floor(Math.random() * 10) + 5;
      const estimatedArrival = new Date();
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedMinutes);
      
      await updateDoc(transportRef, {
        estimatedArrival,
        currentLocation: location,
        status: 'in_progress'
      });
      
      setEtaMinutes(estimatedMinutes);
    } catch (error) {
      console.error('Error updating location', error);
    }
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Emergency Transport Tracking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                transport.status === 'completed' ? 'bg-green-100 text-green-800' : 
                transport.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                transport.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {transport.status.replace('_', ' ').toUpperCase()}
              </span>
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
            <SimpleMap
              center={transport.pickupLocation}
              markers={[
                transport.pickupLocation,
                transport.destination
              ].filter(Boolean)}
              height="350px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportTracking;