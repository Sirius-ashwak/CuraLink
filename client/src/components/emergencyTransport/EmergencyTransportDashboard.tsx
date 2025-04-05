import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ambulance, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { EmergencyTransportWithPatient } from '@shared/schema';

const driverAssignmentSchema = z.object({
  driverName: z.string().min(3, { message: "Driver name is required" }),
  driverPhone: z.string().min(10, { message: "Valid phone number is required" }),
  estimatedArrival: z.string().min(1, { message: "Estimated arrival time is required" }),
});

type DriverAssignmentData = z.infer<typeof driverAssignmentSchema>;

export default function EmergencyTransportDashboard() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null);

  const { data: transportRequests, isLoading, error } = useQuery<EmergencyTransportWithPatient[]>({
    queryKey: ['/api/emergency-transport'],
  });

  const form = useForm<DriverAssignmentData>({
    resolver: zodResolver(driverAssignmentSchema),
    defaultValues: {
      driverName: '',
      driverPhone: '',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16), // 30 mins from now
    },
  });

  const assignDriver = async (data: DriverAssignmentData) => {
    if (!selectedTransportId) return;
    
    try {
      const response = await fetch(`/api/emergency-transport/${selectedTransportId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          estimatedArrival: new Date(data.estimatedArrival).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign driver');
      }

      // Update the data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

      // Close dialog and reset form
      setAssignDialogOpen(false);
      form.reset();
      
      toast({
        title: 'Driver Assigned',
        description: 'Driver has been successfully assigned to the transport request.',
      });
    } catch (error) {
      console.error('Assign driver error:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign driver. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateTransportStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/emergency-transport/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update transport status to ${status}`);
      }

      // Update the data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

      toast({
        title: 'Status Updated',
        description: `Transport status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error('Update status error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transport status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const completeTransport = async (id: number) => {
    try {
      const response = await fetch(`/api/emergency-transport/${id}/complete`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to complete transport');
      }

      // Update the data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

      toast({
        title: 'Transport Completed',
        description: 'The transport request has been marked as completed.',
      });
    } catch (error) {
      console.error('Complete transport error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete transport. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Requested</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Driver Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAssignClick = (id: number) => {
    setSelectedTransportId(id);
    setAssignDialogOpen(true);
  };

  const activeRequests = transportRequests?.filter(t => 
    t.status !== 'completed' && t.status !== 'canceled'
  ) || [];

  const completedRequests = transportRequests?.filter(t => 
    t.status === 'completed' || t.status === 'canceled'
  ) || [];

  if (isLoading) {
    return <div className="p-4 text-center">Loading emergency transport requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading transport requests</div>;
  }

  return (
    <div className="space-y-6">
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Enter driver information to assign them to this emergency transport.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(assignDriver)} className="space-y-4">
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="driverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Arrival Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Assign Driver</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ambulance className="mr-2" /> Active Emergency Transports
          </CardTitle>
          <CardDescription>
            Manage emergency transport requests from patients in rural areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeRequests.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No active emergency transport requests
            </div>
          ) : (
            <div className="space-y-4">
              {activeRequests.map((transport) => (
                <Card key={transport.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => setExpandedId(expandedId === transport.id ? null : transport.id)}
                  >
                    <div className="flex items-center">
                      {getStatusBadge(transport.status)}
                      <span className="ml-3 font-medium">{transport.reason}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock size={16} className="mr-1" />
                      {format(new Date(transport.requestDate), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  
                  {expandedId === transport.id && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <User size={16} className="mr-1" /> Patient
                          </h4>
                          <p className="text-sm mt-1">
                            {transport.patient.firstName} {transport.patient.lastName}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <Calendar size={16} className="mr-1" /> Request Date
                          </h4>
                          <p className="text-sm mt-1">
                            {format(new Date(transport.requestDate), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <MapPin size={16} className="mr-1" /> Pickup Location
                          </h4>
                          <p className="text-sm mt-1">{transport.pickupLocation}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <MapPin size={16} className="mr-1" /> Destination
                          </h4>
                          <p className="text-sm mt-1">{transport.destination}</p>
                        </div>
                        
                        {transport.notes && (
                          <div className="col-span-1 md:col-span-2">
                            <h4 className="text-sm font-semibold">Notes</h4>
                            <p className="text-sm mt-1">{transport.notes}</p>
                          </div>
                        )}
                        
                        {transport.driverName && (
                          <div className="col-span-1 md:col-span-2 mt-2">
                            <h4 className="text-sm font-semibold">Driver Information</h4>
                            <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <p className="text-sm flex items-center">
                                <User size={14} className="mr-1" />
                                <span className="font-medium mr-1">Name:</span> {transport.driverName}
                              </p>
                              <p className="text-sm flex items-center">
                                <Phone size={14} className="mr-1" />
                                <span className="font-medium mr-1">Phone:</span> {transport.driverPhone}
                              </p>
                              {transport.estimatedArrival && (
                                <p className="text-sm flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  <span className="font-medium mr-1">Est. Arrival:</span>{' '}
                                  {format(new Date(transport.estimatedArrival), 'h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        {transport.status === 'requested' && (
                          <Button 
                            onClick={() => handleAssignClick(transport.id)}
                            className="flex items-center"
                            size="sm"
                          >
                            Assign Driver
                          </Button>
                        )}
                        
                        {transport.status === 'assigned' && (
                          <Button 
                            onClick={() => updateTransportStatus(transport.id, 'in_progress')}
                            className="flex items-center"
                            size="sm"
                            variant="secondary"
                          >
                            <ArrowRight size={16} className="mr-1" /> Start Transport
                          </Button>
                        )}
                        
                        {transport.status === 'in_progress' && (
                          <Button 
                            onClick={() => completeTransport(transport.id)}
                            className="flex items-center"
                            size="sm"
                            variant="secondary"
                          >
                            <CheckCircle size={16} className="mr-1" /> Complete Transport
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed/Canceled Transports</CardTitle>
            <CardDescription>
              History of completed and canceled emergency transport requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedRequests.map((transport) => (
                <Card key={transport.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => setExpandedId(expandedId === transport.id ? null : transport.id)}
                  >
                    <div className="flex items-center">
                      {getStatusBadge(transport.status)}
                      <span className="ml-3 font-medium">{transport.reason}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock size={16} className="mr-1" />
                      {format(new Date(transport.requestDate), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  
                  {expandedId === transport.id && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <User size={16} className="mr-1" /> Patient
                          </h4>
                          <p className="text-sm mt-1">
                            {transport.patient.firstName} {transport.patient.lastName}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold flex items-center">
                            <MapPin size={16} className="mr-1" /> Route
                          </h4>
                          <p className="text-sm mt-1">
                            {transport.pickupLocation} → {transport.destination}
                          </p>
                        </div>
                        
                        {transport.driverName && (
                          <div className="col-span-1 md:col-span-2">
                            <h4 className="text-sm font-semibold">Driver Information</h4>
                            <p className="text-sm mt-1">
                              <span className="font-medium">Name:</span> {transport.driverName},
                              <span className="font-medium ml-2">Phone:</span> {transport.driverPhone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}