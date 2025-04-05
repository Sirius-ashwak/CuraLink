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
import { queryClient } from '@/lib/queryClient';
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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        // Try to get address from coordinates using reverse geocoding
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`)
          .then(response => response.json())
          .then(data => {
            if (data.results && data.results.length > 0) {
              const address = data.results[0].formatted_address;
              form.setValue('pickupLocation', address);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingLocation(false));
      },
      (error) => {
        setIsLoadingLocation(false);
        console.error("Error getting location", error);
        toast({
          title: 'Location Error',
          description: 'Unable to get your current location. Please enter it manually.',
          variant: 'destructive',
        });
      }
    );
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
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request Emergency Transport</CardTitle>
        <CardDescription>
          For patients in rural areas who need immediate transportation to medical facilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Transport</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Medical emergency, scheduled surgery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Location</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl className="flex-grow">
                      <Input placeholder="Your current address" {...field} />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center"
                      onClick={getUserLocation}
                      disabled={isLoadingLocation}
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
                      Location detected
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="Hospital or clinic name/address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other important information (medical conditions, mobility needs, etc.)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ambulance">
                          <div className="flex items-center">
                            <Ambulance className="h-4 w-4 mr-2" />
                            <span>Ambulance</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="wheelchair_van">
                          <div className="flex items-center">
                            <PersonStanding className="h-4 w-4 mr-2" />
                            <span>Wheelchair Van</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medical_car">
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-2" />
                            <span>Medical Car</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="helicopter">
                          <div className="flex items-center">
                            <Plane className="h-4 w-4 mr-2" />
                            <span>Helicopter</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Submitting...' : 'Request Emergency Transport'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        For life-threatening emergencies, please call emergency services directly.
      </CardFooter>
    </Card>
  );
}