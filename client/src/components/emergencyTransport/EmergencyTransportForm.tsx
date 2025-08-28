import React, { useState, useEffect } from 'react';
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
import { MapPin, Loader2, Ambulance, Car, Plane, PersonStanding, Map } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LeafletEmergencyMap from '@/components/maps/LeafletEmergencyMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Location {
  lat: number;
  lng: number;
}

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<Location | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{name: string, address: string, distance: string}>>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

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

  // Show loading state while authentication is being checked
  if (isAuthLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading emergency transport form...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    console.log('EmergencyTransportForm: User not authenticated, showing auth required message');
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ambulance className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">You must be logged in to request emergency transport.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  console.log('EmergencyTransportForm: User authenticated, rendering form. User:', user);

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
    
    // Use default India coordinates for demo/testing if geolocation fails
    const useSampleLocation = () => {
      const sampleCoords = {
        lat: 28.6139,
        lng: 77.2090 // New Delhi, India
      };
      setUserCoordinates(sampleCoords);
      form.setValue('pickupLocation', 'Connaught Place, New Delhi, India');
      findNearbyHospitals(sampleCoords.lat, sampleCoords.lng);
      setIsLoadingLocation(false);
      toast({
        title: 'Using Sample Location',
        description: 'Using New Delhi as sample location for demonstration.',
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

  // Function to handle location selection from map
  const handleMapLocationSelect = (location: Location) => {
    setDestinationCoordinates(location);
    
    // Try to get a more user-friendly location name for India
    const getLocationName = (lat: number, lng: number) => {
      // Approximate location names for India (you can expand this)
      if (lat >= 28.5 && lat <= 28.8 && lng >= 77.0 && lng <= 77.3) {
        return 'New Delhi Area';
      } else if (lat >= 19.0 && lat <= 19.2 && lng >= 72.8 && lng <= 73.0) {
        return 'Mumbai Area';
      } else if (lat >= 12.9 && lat <= 13.1 && lng >= 77.5 && lng <= 77.7) {
        return 'Bangalore Area';
      } else if (lat >= 22.5 && lat <= 22.7 && lng >= 88.3 && lng <= 88.5) {
        return 'Kolkata Area';
      } else if (lat >= 13.0 && lat <= 13.2 && lng >= 80.2 && lng <= 80.4) {
        return 'Chennai Area';
      } else {
        return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    };
    
    const locationName = getLocationName(location.lat, location.lng);
    form.setValue('destination', locationName);
    
    toast({
      title: '📍 Destination Selected!',
      description: `Location set to: ${locationName}. Switch back to the form to complete your request.`,
    });
  };

  // Function to reverse geocode coordinates to address (simplified)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // This would normally use a geocoding service like Mapbox or Google
      // For now, return a formatted coordinate string
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Function to find nearby hospitals (simulated)
  const findNearbyHospitals = (lat: number, lng: number) => {
    setIsLoadingHospitals(true);
    
    // Simulated hospital data for India
    setTimeout(() => {
      setNearbyHospitals([
        { name: 'All India Institute of Medical Sciences (AIIMS)', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', distance: '2.5km' },
        { name: 'Safdarjung Hospital', address: 'Ansari Nagar West, New Delhi', distance: '3.2km' },
        { name: 'Ram Manohar Lohia Hospital', address: 'Baba Kharak Singh Marg, New Delhi', distance: '4.1km' },
        { name: 'Lady Hardinge Medical College', address: 'Connaught Place, New Delhi', distance: '1.8km' }
      ]);
      setIsLoadingHospitals(false);
    }, 1000);
  };

  // Function to set destination to a selected hospital
  const selectHospital = (hospitalAddress: string) => {
    form.setValue('destination', hospitalAddress);
  };

  const handleSubmit = async (data: EmergencyTransportFormData) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('handleSubmit called with data:', data);
    console.log('Current user state:', user);
    console.log('User coordinates:', userCoordinates);
    console.log('Destination coordinates:', destinationCoordinates);
    
    if (!user) {
      console.error('handleSubmit: User is null, cannot proceed');
      toast({
        title: "Error",
        description: "You must be logged in to request emergency transport",
        variant: "destructive"
      });
      return;
    }

    // Validate that we have coordinates
    if (!userCoordinates || !destinationCoordinates) {
      toast({
        title: "Location Required",
        description: "Please select both pickup and destination locations on the map",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the transport request payload with coordinates
      const transportRequest = {
        patientId: user?.id ? parseInt(user.id.toString()) : 1, // Ensure patientId is an integer
        pickupLocation: data.pickupLocation || (userCoordinates ? `Location: ${userCoordinates.lat.toFixed(4)}, ${userCoordinates.lng.toFixed(4)}` : ''),
        destination: data.destination || (destinationCoordinates ? `Location: ${destinationCoordinates.lat.toFixed(4)}, ${destinationCoordinates.lng.toFixed(4)}` : ''),
        reason: data.reason,
        urgency: data.urgency,
        vehicleType: data.vehicleType,
        pickupCoordinates: userCoordinates ? `${userCoordinates.lat},${userCoordinates.lng}` : '',
        destinationCoordinates: destinationCoordinates ? `${destinationCoordinates.lat},${destinationCoordinates.lng}` : '',
        notes: data.notes || ''
      };

      console.log('Submitting transport request:', transportRequest);
      console.log('User object:', user);
      console.log('User ID type:', user?.id ? typeof user.id : 'No user ID');

      // Make the API request
      const response = await fetch('/api/emergency/transport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transportRequest)
      });

      // Enhanced error handling
      if (!response.ok) {
        let errorText = '';
        let errorData = {};

        try {
          // Try to parse as JSON first
          errorData = await response.json().catch(() => ({}));
        } catch (jsonError) {
          console.error('Failed to parse JSON error response:', jsonError);
        }

        // If JSON parsing fails, try to get text
        try {
          errorText = await response.text();
        } catch (textError) {
          console.error('Failed to get error text:', textError);
        }

        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText
        });

        // Throw a detailed error
        throw new Error(
          (errorData as any)?.message || 
          errorText || 
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      
      toast({
        title: "🚑 Emergency Transport Requested!",
        description: `Your request has been submitted successfully. Request ID: ${result.id || 'N/A'}. Help is on the way!`,
      });
      
      // Show success message
      toast({
        title: "✅ Request Submitted Successfully!",
        description: "Emergency services have been notified. You will receive updates shortly.",
      });
      
      // Reset form and coordinates
      form.reset();
      setUserCoordinates(null);
      setDestinationCoordinates(null);
      setNearbyHospitals([]);
      setActiveTab('form');
      
    } catch (error) {
      console.error('Emergency transport request error:', error);
      toast({
        title: "❌ Request Failed",
        description: error instanceof Error ? error.message : "Failed to submit emergency transport request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">
            <Ambulance className="w-4 h-4 mr-2" />
            Request Form
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="w-4 h-4 mr-2" />
            Interactive Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card className="shadow-lg">
            <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl text-center sm:text-left">
                <span className="mr-2 inline-block">🚑</span> 
                Request Emergency Transport
              </CardTitle>
                             <CardDescription className="text-center sm:text-left text-sm">
                 For patients across India who need immediate transportation to medical facilities. 
                 Select your pickup and destination locations on the interactive map.
               </CardDescription>
            </CardHeader>
      <CardContent className="px-4 sm:px-6 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                Debug: User ID: {user?.id || 'Not loaded'}, Auth Loading: {isAuthLoading ? 'Yes' : 'No'}
              </div>
            )}
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
              disabled={isSubmitting || !userCoordinates || !destinationCoordinates}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Submitting Request...</span>
                </>
              ) : !userCoordinates || !destinationCoordinates ? (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Select Locations on Map First</span>
                </>
              ) : (
                <>
                  <Ambulance className="h-4 w-4 mr-2" />
                  <span>🚑 Request Emergency Transport</span>
                </>
              )}
            </Button>
            
            {/* Location Status Indicator */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${userCoordinates ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Pickup: {userCoordinates ? '✓ Set' : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${destinationCoordinates ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Destination: {destinationCoordinates ? '✓ Set' : 'Not set'}</span>
                </div>
              </div>
              {userCoordinates && destinationCoordinates && (
                <p className="text-xs text-green-600 mt-2 text-center">
                  🎯 Both locations set! You can now submit your request.
                </p>
              )}
            </div>
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
        </TabsContent>

        <TabsContent value="map">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Pickup & Destination
              </CardTitle>
              <CardDescription>
                Click on the map to select your pickup location and destination. 
                {userCoordinates && destinationCoordinates && (
                  <span className="text-green-600 ml-2">
                    ✓ Locations selected
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Location Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-sm">Pickup Location</span>
                    </div>
                    {userCoordinates ? (
                      <p className="text-xs text-gray-600">
                        {form.getValues('pickupLocation') || `${userCoordinates.lat.toFixed(4)}, ${userCoordinates.lng.toFixed(4)}`}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={getUserLocation}
                          disabled={isLoadingLocation}
                        >
                          {isLoadingLocation ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <MapPin className="h-3 w-3 mr-1" />
                          )}
                          Get Location
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-sm">Destination</span>
                    </div>
                    {destinationCoordinates ? (
                      <p className="text-xs text-gray-600">
                        {form.getValues('destination') || `${destinationCoordinates.lat.toFixed(4)}, ${destinationCoordinates.lng.toFixed(4)}`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Click on map to select</p>
                    )}
                  </div>
                </div>

                                 {/* Interactive Map */}
                 <div className="border rounded-lg overflow-hidden">
                   {user && userCoordinates ? (
                     <div>
                       {(() => { console.log('Rendering map with:', { user, userCoordinates, destinationCoordinates }); return null; })()}
                       <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded mb-2">
                         Debug: Map props - userLocation: {JSON.stringify(userCoordinates)}, destination: {JSON.stringify(destinationCoordinates)}
                       </div>
                       <LeafletEmergencyMap
                         userLocation={userCoordinates ?? undefined}
                         destination={destinationCoordinates ?? undefined}
                         emergencyType="medical"
                         showRoute={!!(userCoordinates && destinationCoordinates)}
                         onLocationSelect={handleMapLocationSelect}
                         vehicles={[]} // No vehicles shown in form mode
                         height="400px"
                         className="w-full"
                       />
                     </div>
                   ) : (
                     <div className="h-[400px] flex items-center justify-center bg-gray-100">
                       <div className="text-center text-gray-500">
                         <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                         <p>Please set your pickup location first</p>
                       </div>
                     </div>
                   )}
                 </div>

                {/* Map Instructions */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">How to use the map:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Click "Get Location" to set your current position as pickup</li>
                    <li>• Click anywhere on the map to set your destination</li>
                    <li>• Blue marker shows your pickup location</li>
                    <li>• Red marker shows your destination</li>
                    <li>• Switch back to "Request Form" to complete your request</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('form')}
                    disabled={!userCoordinates || !destinationCoordinates}
                  >
                    Back to Form
                  </Button>
                  {userCoordinates && destinationCoordinates && (
                    <Button
                      onClick={() => setActiveTab('form')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Locations Set - Complete Request
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}