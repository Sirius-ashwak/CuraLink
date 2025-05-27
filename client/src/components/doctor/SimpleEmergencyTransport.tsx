import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ambulance, Clock, MapPin, Phone } from "lucide-react";
import { EmergencyTransportWithPatient } from "@shared/schema";
import { format } from "date-fns";

export default function SimpleEmergencyTransport() {
  // Fetch real emergency transport data from Firebase
  const { data: requests = [], isLoading, error } = useQuery<EmergencyTransportWithPatient[]>({
    queryKey: ["/api/emergency-transport"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">🚨 Requested</Badge>;
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">🚗 Driver Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800 border-green-300">🚑 In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-center py-8">
          <Ambulance className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading emergency transport requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-center py-8 text-red-500">
          <p>Error loading emergency transport requests</p>
        </div>
      </div>
    );
  }

  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'canceled');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Ambulance className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Emergency Transport Requests</h3>
          </div>
          <Badge className="bg-red-100 text-red-800">
            {activeRequests.length} Active
          </Badge>
        </div>

        <div className="space-y-4">
          {activeRequests.map((request) => (
            <Card key={request.id} className={`border-l-4 ${getUrgencyColor(request.urgency)} bg-gray-50 dark:bg-gray-800`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {request.patient.firstName} {request.patient.lastName}
                  </CardTitle>
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  {format(new Date(request.requestDate), 'MMM d, h:mm a')}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reason: {request.reason}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Pickup</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.pickupLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Destination</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.destination}</p>
                    </div>
                  </div>
                </div>

                {request.driverName && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Driver Assigned</p>
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {request.driverName} - {request.driverPhone}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {request.status === 'requested' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Assign Driver
                    </Button>
                  )}
                  {request.status === 'assigned' && (
                    <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      Start Transport
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Ambulance className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No emergency transport requests at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}