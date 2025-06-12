import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Loader2, Ambulance, Car, Plane, PersonStanding } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const emergencyTransportSchema = z.object({
  reason: z.string().min(5, { message: "Please provide a reason for transport" }),
  pickupLocation: z.string().min(5, { message: "Please provide your pickup location" }),
  destination: z.string().min(5, { message: "Please provide your destination" }),
  notes: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select urgency level"
  }),
  vehicleType: z.enum(["ambulance", "wheelchair_van", "medical_car", "helicopter"], {
    required_error: "Please select vehicle type"
  }),
});

type EmergencyTransportFormData = z.infer<typeof emergencyTransportSchema>;

export default function EmergencyTransportForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{name: string, address: string, distance: string}>>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  const form = useForm<EmergencyTransportFormData>({
    resolver: zodResolver(emergencyTransportSchema),
    defaultValues: {
      reason: '',
      pickupLocation: '',
      destination: '',
      notes: '',
      urgency: 'high',
      vehicleType: 'ambulance',
    },
  });

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
      form.setValue('pickupLocation', '123 Market Street, San Francisco, CA 94103');
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
        form.setValue('pickupLocation', `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        findNearbyHospitals(coords.lat, coords.lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location", error);
        useSampleLocation();
      }
    );
  };

  // Function to find nearby hospitals (simulated)
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
    form.setValue('destination', hospitalAddress);
  };

  const handleSubmit = async (data: EmergencyTransportFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request emergency transport",
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
      
      // Reset form
      form.reset();
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

  // Helper function to calculate distance between two points (simulated)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    // Simple distance calculation for demonstration
    const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // rough km conversion
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  }

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Reason for Transport</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Medical emergency, scheduled surgery" {...field} 
                      className="h-9 sm:h-10"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Pickup Location</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl className="flex-grow">
                      <Input placeholder="Your current address" {...field} 
                        className="h-9 sm:h-10"
                      />
                    </FormControl>
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="Hospital or clinic name/address" {...field} 
                      className="h-9 sm:h-10"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                  
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other important information (medical conditions, mobility needs, etc.)" 
                      {...field}
                      className="min-h-20 text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Urgency Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low" className="text-sm">Low</SelectItem>
                        <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                        <SelectItem value="high" className="text-sm">High</SelectItem>
                        <SelectItem value="critical" className="text-sm text-red-600 dark:text-red-400">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Vehicle Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ambulance" className="text-sm">
                          <div className="flex items-center">
                            <Ambulance className="h-3.5 w-3.5 mr-2" />
                            <span>Ambulance</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="wheelchair_van" className="text-sm">
                          <div className="flex items-center">
                            <PersonStanding className="h-3.5 w-3.5 mr-2" />
                            <span>Wheelchair Van</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medical_car" className="text-sm">
                          <div className="flex items-center">
                            <Car className="h-3.5 w-3.5 mr-2" />
                            <span>Medical Car</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="helicopter" className="text-sm">
                          <div className="flex items-center">
                            <Plane className="h-3.5 w-3.5 mr-2" />
                            <span>Helicopter</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
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
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs sm:text-sm text-muted-foreground px-4 sm:px-6 py-3">
        <div className="flex items-center">
          <span className="text-red-500 mr-1">⚠️</span>
          For life-threatening emergencies, please call emergency services directly.
        </div>
      </CardFooter>
    </Card>
  );
}