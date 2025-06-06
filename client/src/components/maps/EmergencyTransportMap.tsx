import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { firestore } from '../../lib/googleCloud';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Map container styles
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

// Default center (can be overridden with user's location)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194 // San Francisco
};

interface Location {
  lat: number;
  lng: number;
}

interface TransportVehicle {
  id: string;
  vehicleId: string;
  driverName: string;
  driverPhone: string;
  currentLocation: Location;
  destinationLocation: Location;
  status: 'available' | 'assigned' | 'in_progress' | 'completed';
  patientId?: number;
  estimatedArrival?: Date;
  transportType: 'ambulance' | 'wheelchair_van' | 'medical_car' | 'helicopter';
}

interface EmergencyTransportMapProps {
  transportId?: string;
  patientLocation?: Location;
  destinationLocation?: Location; 
  onLocationUpdate?: (location: Location) => void;
  viewOnly?: boolean;
  width?: string;
  height?: string;
}

const EmergencyTransportMap: React.FC<EmergencyTransportMapProps> = ({ 
  transportId,
  patientLocation,
  destinationLocation,
  onLocationUpdate,
  viewOnly = false,
  width = '100%',
  height = '500px'
}) => {
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '',
    libraries: ['places']
  });

  // State management
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState<Location>(patientLocation || defaultCenter);

  // Reference to the transportation vehicle for this specific transport
  const [selectedVehicle, setSelectedVehicle] = useState<TransportVehicle | null>(null);

  // Track map loading state
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Map reference callback
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsMapLoaded(true);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    setIsMapLoaded(false);
  }, []);

  // Fetch vehicles with real-time updates from Firestore
  useEffect(() => {
    if (!firestore) return;
    
    const vehiclesRef = collection(firestore, 'transportVehicles');
    
    const unsubscribe = onSnapshot(vehiclesRef, (snapshot) => {
      const vehicleData: TransportVehicle[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as TransportVehicle;
        // Convert any Firestore timestamps to Date objects
        if (data.estimatedArrival && data.estimatedArrival instanceof Timestamp) {
          data.estimatedArrival = data.estimatedArrival.toDate();
        }
        vehicleData.push({ id: doc.id, ...data });
      });
      
      setVehicles(vehicleData);
      
      // If we have a transport ID, find the assigned vehicle
      if (transportId) {
        const matchingVehicle = vehicleData.find(v => v.patientId === Number(transportId));
        if (matchingVehicle) {
          setSelectedVehicle(matchingVehicle);
        }
      }
    });
    
    return () => unsubscribe();
  }, [transportId, firestore]);

  // Get directions when we have a patient location and destination
  useEffect(() => {
    if (!isMapLoaded || !patientLocation || !destinationLocation) return;
    
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(patientLocation.lat, patientLocation.lng),
        destination: new google.maps.LatLng(destinationLocation.lat, destinationLocation.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }, [isMapLoaded, patientLocation, destinationLocation]);

  // Simulate vehicle movement (in a real app, this would come from GPS updates)
  useEffect(() => {
    if (!selectedVehicle || !directions || viewOnly) return;
    
    // Get the route path from directions
    const path = directions.routes[0].overview_path;
    let currentIndex = 0;
    
    // Update vehicle position along the route path
    const interval = setInterval(() => {
      if (currentIndex >= path.length) {
        clearInterval(interval);
        return;
      }
      
      const newLocation = {
        lat: path[currentIndex].lat(),
        lng: path[currentIndex].lng()
      };
      
      // Update Firestore with new location
      const vehicleRef = doc(firestore, 'transportVehicles', selectedVehicle.id);
      updateDoc(vehicleRef, { currentLocation: newLocation })
        .catch(error => console.error('Error updating vehicle location', error));
      
      // Call the callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }
      
      currentIndex++;
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [selectedVehicle, directions, viewOnly, onLocationUpdate]);

  // Handle marker click
  const handleMarkerClick = (markerId: string) => {
    setActiveMarker(markerId);
  };

  // Style based on vehicle type
  const getVehicleIcon = (type: string) => {
    const commonStyles = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 5,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
    
    switch(type) {
      case 'ambulance':
        return {
          ...commonStyles,
          fillColor: '#f44336',
        };
      case 'helicopter': 
        return {
          ...commonStyles,
          fillColor: '#ff9800',
        };
      case 'wheelchair_van':
        return {
          ...commonStyles,
          fillColor: '#4caf50',
        };
      default:
        return {
          ...commonStyles,
          fillColor: '#2196f3',
        };
    }
  };

  // Show loading message if Maps API is still loading
  if (loadError) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">Error loading maps. Please check your API key.</div>
  }

  if (!isLoaded) {
    return <div className="p-4 text-center">Loading maps...</div>
  }

  return (
    <div style={{ width, height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          zoomControl: true,
        }}
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
        
        {/* Direction route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5,
              },
            }}
          />
        )}
        
        {/* Vehicle markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={vehicle.currentLocation}
            onClick={() => handleMarkerClick(vehicle.id)}
            icon={getVehicleIcon(vehicle.transportType)}
          >
            {activeMarker === vehicle.id && (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold">{vehicle.transportType}</h3>
                  <p>Driver: {vehicle.driverName}</p>
                  <p>Status: {vehicle.status}</p>
                  {vehicle.estimatedArrival && (
                    <p>ETA: {vehicle.estimatedArrival.toLocaleTimeString()}</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
};

export default EmergencyTransportMap;