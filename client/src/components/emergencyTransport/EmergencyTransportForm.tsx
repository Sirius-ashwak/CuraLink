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
import { MapPin, Loader2 } from 'lucide-react';

const emergencyTransportSchema = z.object({
  reason: z.string().min(5, { message: "Please provide a reason for transport" }),
  pickupLocation: z.string().min(5, { message: "Please provide your pickup location" }),
  destination: z.string().min(5, { message: "Please provide your destination" }),
  notes: z.string().optional(),
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
          requestDate: new Date().toISOString(),
          pickupCoordinates: userCoordinates ? `${userCoordinates.lat},${userCoordinates.lng}` : null,
          urgency: 'high', // Default urgency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit emergency transport request');
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
        description: 'Failed to submit emergency transport request. Please try again.',
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