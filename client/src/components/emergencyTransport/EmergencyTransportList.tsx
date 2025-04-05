import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ambulance, Clock, MapPin, Info, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { EmergencyTransportWithPatient } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function EmergencyTransportList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: transportRequests, isLoading, error } = useQuery<EmergencyTransportWithPatient[]>({
    queryKey: ['/api/emergency-transport', user?.id],
    enabled: !!user?.id,
  });

  const cancelTransport = async (id: number) => {
    try {
      const response = await fetch(`/api/emergency-transport/${id}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel transport request');
      }

      // Update the data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });

      toast({
        title: 'Transport Canceled',
        description: 'Your emergency transport request has been canceled.',
      });
    } catch (error) {
      console.error('Cancel transport error:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel transport request. Please try again.',
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

  if (isLoading) {
    return <div className="p-4 text-center">Loading transport requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading transport requests</div>;
  }

  if (!transportRequests || transportRequests.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Emergency Transports</CardTitle>
          <CardDescription>You have no emergency transport requests</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ambulance className="mr-2" /> Emergency Transports
          </CardTitle>
          <CardDescription>Your emergency transport requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transportRequests.map((transport) => (
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
                          <h4 className="text-sm font-semibold flex items-center">
                            <Info size={16} className="mr-1" /> Notes
                          </h4>
                          <p className="text-sm mt-1">{transport.notes}</p>
                        </div>
                      )}

                      {transport.driverName && (
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-sm font-semibold">Driver Information</h4>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Name:</span> {transport.driverName}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {transport.driverPhone}
                          </p>
                          {transport.estimatedArrival && (
                            <p className="text-sm">
                              <span className="font-medium">Est. Arrival:</span> {' '}
                              {format(new Date(transport.estimatedArrival), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {transport.status === 'requested' && (
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelTransport(transport.id);
                          }}
                          className="flex items-center"
                        >
                          <X size={16} className="mr-1" /> Cancel Request
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}