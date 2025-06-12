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
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Loader2, Ambulance, Car, Plane, PersonStanding, Mic } from 'lucide-react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

  // Function to find nearby hospitals using Google Places API
  const findNearbyHospitals = async (lat: number, lng: number) => {
    setIsLoadingHospitals(true);
    try {
      // Use the Google Maps API key from environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        toast({
          title: 'Configuration Error',
          description: 'Google Maps API key is missing. Please check your configuration.',
          variant: 'destructive',
        });
        setIsLoadingHospitals(false);
        return;
      }
      
      // Make a request to the Google Places API
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby hospitals');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
      // Format the hospital data
      const hospitals = data.results.map((place: any) => ({
        name: place.name,
        address: place.vicinity,
        distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
      }));
      
      // Sort by distance
      hospitals.sort((a: any, b: any) => {
        const distA = parseFloat(a.distance.replace('km', '').replace('m', ''));
        const distB = parseFloat(b.distance.replace('km', '').replace('m', ''));
        return distA - distB;
      });
      
      setNearbyHospitals(hospitals.slice(0, 5));
    } catch (error) {
      console.error('Error finding nearby hospitals:', error);
      toast({
        title: 'Error',
        description: 'Unable to find nearby hospitals. Please enter destination manually.',
        variant: 'destructive',
      });
      
      // Fallback data for demonstration
      setNearbyHospitals([
        { name: 'City General Hospital', address: '123 Main St, San Francisco, CA', distance: '2.5km' },
        { name: 'Memorial Medical Center', address: '456 Oak Ave, San Francisco, CA', distance: '3.2km' },
        { name: 'Community Health Hospital', address: '789 Pine St, San Francisco, CA', distance: '4.1km' }
      ]);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  // Function to set destination to a selected hospital
  const selectHospital = (hospitalAddress: string) => {
    form.setValue('destination', hospitalAddress);
  };

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
    
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserCoordinates(coords);
        
        // Try to get address from coordinates using reverse geocoding
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
              if (data.results && data.results.length > 0) {
                const address = data.results[0].formatted_address;
                form.setValue('pickupLocation', address);
                
                // Find nearby hospitals once we have the user's location
                findNearbyHospitals(coords.lat, coords.lng);
              } else {
                // Fallback if geocoding doesn't return results
                form.setValue('pickupLocation', `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                findNearbyHospitals(coords.lat, coords.lng);
              }
            })
            .catch((err) => {
              console.error('Geocoding error:', err);
              // Still try to find hospitals even if geocoding fails
              findNearbyHospitals(coords.lat, coords.lng);
              form.setValue('pickupLocation', `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
            })
            .finally(() => setIsLoadingLocation(false));
        } else {
          form.setValue('pickupLocation', `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          findNearbyHospitals(coords.lat, coords.lng);
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        
        // Show error message with option to use sample location
        toast({
          title: 'Location Permission Required',
          description: 'Please allow location access or use the sample location button below.',
          variant: 'destructive',
          action: (
            <Button variant="secondary" size="sm" onClick={useSampleLocation}>
              Use Sample Location
            </Button>
          ),
          duration: 10000,
        });
        
        setIsLoadingLocation(false);
      },
      options
    );
  };

  // Start voice recording for reason input
  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !MediaRecorder) {
        toast({
          title: 'Voice Recording Not Supported',
          description: 'Your browser does not support voice recording.',
          variant: 'destructive',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Create form data to send to server
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          toast({
            title: 'Processing Voice Input',
            description: 'Converting your voice to text...',
          });
          
          // Send to server for speech-to-text processing
          const response = await fetch('/api/voice-assistant/speech-to-text', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to process voice input');
          }
          
          const result = await response.json();
          
          if (result.text) {
            form.setValue('reason', result.text);
            toast({
              title: 'Voice Input Processed',
              description: 'Your voice has been converted to text.',
            });
          } else {
            toast({
              title: 'No Speech Detected',
              description: 'Please try again and speak clearly.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error processing voice input:', error);
          toast({
            title: 'Voice Processing Failed',
            description: 'Could not process your voice input. Please try typing instead.',
            variant: 'destructive',
          });
        }
        
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      // Automatically stop recording after 10 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
        }
      }, 10000);
      
      toast({
        title: 'Recording Started',
        description: 'Speak clearly to describe your emergency. Recording will stop automatically after 10 seconds.',
      });
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to use voice input.',
        variant: 'destructive',
      });
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const onSubmit = async (data: EmergencyTransportFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to request emergency transport',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/emergency-transport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          reason: data.reason,
          pickupLocation: data.pickupLocation,
          destination: data.destination,
          notes: data.notes || null,
          pickupCoordinates: userCoordinates ? `${userCoordinates.lat},${userCoordinates.lng}` : null,
          urgency: data.urgency,
          vehicleType: data.vehicleType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Transport request error:', errorData);
        throw new Error(errorData.message || 'Failed to submit emergency transport request');
      }

      // Reset form
      form.reset();
      
      // Invalidate query to refresh data
      apiRequest('/api/emergency-transport', { method: 'GET' });

      toast({
        title: 'Emergency Transport Requested',
        description: 'Your emergency transport request has been submitted. Help is on the way.',
      });
    } catch (error) {
      console.error('Emergency transport request error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit emergency transport request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to calculate distance between coordinates
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance < 1 ? 
      `${Math.round(distance * 1000)}m` : 
      `${distance.toFixed(1)}km`;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Reason for Transport</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="E.g., Medical emergency, scheduled surgery" {...field} 
                        className="h-9 sm:h-10"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant={isRecording ? "destructive" : "outline"} 
                      size="icon"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className="h-9 sm:h-10 w-9 sm:w-10"
                      title={isRecording ? "Stop recording" : "Describe reason by voice"}
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
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