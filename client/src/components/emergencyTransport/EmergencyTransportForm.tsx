import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Ambulance, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

/**
 * Calculate distance between two points on Earth using the Haversine formula
 * Returns the distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  if (distance < 1) {
    // For distances less than 1 km, convert to meters
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
}

interface EmergencyTransportFormProps {
  onTransportRequested?: () => void;
}

export default function EmergencyTransportForm({ onTransportRequested }: EmergencyTransportFormProps) {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("3");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{name: string, address: string, distance: string}>>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [reason, setReason] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("ambulance");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingLocation(true);
    
    // Use default San Francisco coordinates for demo/testing if geolocation fails
    const useSampleLocation = () => {
      const sampleCoords = {
        lat: 37.7749,
        lng: -122.4194 // San Francisco
      };
      setUserCoordinates(sampleCoords);
      setPickupLocation('123 Market Street, San Francisco, CA 94103');
      findNearbyHospitals(sampleCoords.lat, sampleCoords.lng);
      setIsLoadingLocation(false);
      toast({
        title: 'Using Sample Location',
        description: 'Using San Francisco as sample location for demonstration.',
      });
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserCoordinates(coords);
        setPickupLocation(`Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        findNearbyHospitals(coords.lat, coords.lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location", error);
        useSampleLocation();
      }
    );
  };

  // Function to find nearby medical facilities using Google Places API
  const findNearbyHospitals = (lat: number, lng: number) => {
    setIsLoadingHospitals(true);
    
    // Simulated hospital data for demonstration
    setTimeout(() => {
      setNearbyHospitals([
        { name: 'City General Hospital', address: '123 Main St, San Francisco, CA', distance: '2.5km' },
        { name: 'Memorial Medical Center', address: '456 Oak Ave, San Francisco, CA', distance: '3.2km' },
        { name: 'Community Health Hospital', address: '789 Pine St, San Francisco, CA', distance: '4.1km' }
      ]);
      setIsLoadingHospitals(false);
    }, 1000);
  };

  // Function to set destination to a selected hospital
  const selectHospital = (hospitalAddress: string) => {
    setDestination(hospitalAddress);
  };

  const handleSubmit = async () => {
    if (!reason || !pickupLocation || !destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Emergency Transport Requested",
        description: "Your emergency transport request has been submitted. Help is on the way.",
      });
      
      // Call the callback if provided
      if (onTransportRequested) {
        onTransportRequested();
      }
      
      // Reset form
      setReason("");
      setPickupLocation("");
      setDestination("");
      setNotes("");
      setUserCoordinates(null);
      setNearbyHospitals([]);
      
    } catch (error) {
      console.error('Emergency transport request error:', error);
      toast({
        title: "Error",
        description: "Failed to submit emergency transport request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
        <CardTitle className="text-xl sm:text-2xl text-center sm:text-left">
          <span className="mr-2 inline-block">🚑</span> 
          Request Emergency Transport
        </CardTitle>
        <CardDescription className="text-center sm:text-left text-sm">
          For patients in rural areas who need immediate transportation to medical facilities
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for Transport</Label>
            <Input
              placeholder="E.g., Medical emergency, scheduled surgery"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 sm:h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Pickup Location</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Your current address"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="h-9 sm:h-10"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center h-9 sm:h-10 w-9 sm:w-10 p-0"
                onClick={getUserLocation}
                disabled={isLoadingLocation}
                title="Use your current location"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            {userCoordinates && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Location detected
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Destination</Label>
            <Input
              placeholder="Hospital or clinic name/address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-9 sm:h-10"
            />
          </div>
          
          {isLoadingHospitals && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs sm:text-sm">Finding nearby hospitals...</span>
              </div>
            </div>
          )}
          
          {!isLoadingHospitals && nearbyHospitals.length > 0 && (
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-medium mb-1">Nearby Hospitals:</p>
              <div className="space-y-1 max-h-32 sm:max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                {nearbyHospitals.map((hospital, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                    onClick={() => selectHospital(hospital.address)}
                  >
                    <div className="font-medium truncate">{hospital.name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs flex justify-between">
                      <span className="truncate max-w-[70%] sm:max-w-[80%]">{hospital.address}</span>
                      <span className="ml-1 whitespace-nowrap">{hospital.distance}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea 
              placeholder="Any other important information (medical conditions, mobility needs, etc.)" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <Select
                value={urgency}
                onValueChange={setUrgency}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-sm">Low</SelectItem>
                  <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                  <SelectItem value="high" className="text-sm">High</SelectItem>
                  <SelectItem value="critical" className="text-sm text-red-600 dark:text-red-400">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={vehicleType}
                onValueChange={setVehicleType}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulance" className="text-sm">
                    <div className="flex items-center">
                      <Ambulance className="h-3.5 w-3.5 mr-2" />
                      <span>Ambulance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="wheelchair_van" className="text-sm">
                    <div className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-2" />
                      <span>Wheelchair Van</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medical_car" className="text-sm">
                    <div className="flex items-center">
                      <Car className="h-3.5 w-3.5 mr-2" />
                      <span>Medical Car</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-10 sm:h-11 mt-2 sm:mt-4" 
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Ambulance className="h-4 w-4 mr-2" />
                <span>Request Emergency Transport</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <div className="flex justify-center text-xs sm:text-sm text-muted-foreground px-4 sm:px-6 py-3">
        <div className="flex items-center">
          <span className="text-red-500 mr-1">⚠️</span>
          For life-threatening emergencies, please call emergency services directly.
        </div>
      </div>
    </Card>
  );
}

// Car icon component for vehicle type selection
function Car(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}