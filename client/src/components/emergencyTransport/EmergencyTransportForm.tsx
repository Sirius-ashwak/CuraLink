import { useState } from 'react';
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

  const form = useForm<EmergencyTransportFormData>({
    resolver: zodResolver(emergencyTransportSchema),
    defaultValues: {
      reason: '',
      pickupLocation: '',
      destination: '',
      notes: '',
    },
  });

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
                  <FormControl>
                    <Input placeholder="Your current address" {...field} />
                  </FormControl>
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