import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ambulance, Clock, MapPin, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function EmergencyTransportList() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Sample emergency transport data for demonstration
  const transportRequests = [
    {
      id: 1,
      status: 'requested',
      reason: 'Severe chest pain',
      requestDate: new Date(Date.now() - 3600000), // 1 hour ago
      pickupLocation: '123 Rural Road, San Francisco, CA 94103',
      destination: 'General Hospital',
      patient: {
        firstName: 'John',
        lastName: 'Doe'
      },
      urgency: 'high'
    },
    {
      id: 2,
      status: 'assigned',
      reason: 'Scheduled dialysis appointment',
      requestDate: new Date(Date.now() - 7200000), // 2 hours ago
      pickupLocation: '456 Mountain View, San Francisco, CA 94103',
      destination: 'Kidney Care Center',
      patient: {
        firstName: 'Jane',
        lastName: 'Smith'
      },
      driverName: 'Michael Wilson',
      driverPhone: '(555) 123-4567',
      estimatedArrival: new Date(Date.now() + 1200000), // 20 minutes from now
      urgency: 'medium'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">Requested</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">Driver Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Completed</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const cancelTransport = (id: number) => {
    toast({
      title: 'Transport Canceled',
      description: 'Your emergency transport request has been canceled.',
    });
  };

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
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === transport.id ? null : transport.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {getStatusBadge(transport.status)}
                      <span className="ml-3 font-medium truncate max-w-[200px]">{transport.reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock size={16} className="mr-1" />
                        {format(transport.requestDate, 'MMM d, h:mm a')}
                      </div>
                      <div className="ml-2">
                        {expandedId === transport.id ? 
                          <ChevronUp size={16} className="text-muted-foreground" /> : 
                          <ChevronDown size={16} className="text-muted-foreground" />
                        }
                      </div>
                    </div>
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
                              {format(transport.estimatedArrival, 'h:mm a')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {transport.status === 'requested' && (
                      <div className="mt-4 flex justify-center md:justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelTransport(transport.id);
                          }}
                          className="flex items-center w-full md:w-auto"
                        >
                          <AlertTriangle size={16} className="mr-1" /> Cancel Request
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