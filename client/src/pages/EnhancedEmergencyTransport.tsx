import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import EmergencyTransportForm from '../components/EmergencyTransport/EmergencyTransportForm';
import EmergencyTransportList from '../components/EmergencyTransport/EmergencyTransportList';
import NearbyFacilitiesMap from '../components/EmergencyTransport/NearbyFacilitiesMap';
import { ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

const EnhancedEmergencyTransport: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const [destination, setDestination] = useState('');
  const [transportRequested, setTransportRequested] = useState(false);

  // Get user ID from auth context
  const patientId = user?.id?.toString() || '1';

  const handleSelectFacility = (facilityName: string, facilityAddress: string) => {
    setDestination(`${facilityName}, ${facilityAddress}`);
    // Switch back to the request tab
    setActiveTab('request');
  };

  const handleTransportRequested = () => {
    setTransportRequested(true);
  };

  if (transportRequested) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardContent className="pt-6 pb-8 px-6 flex flex-col items-center justify-center text-center">
            <div className="mb-4 bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Transport Request Confirmed</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Your emergency transport has been requested and dispatched. You'll receive updates on your mobile device.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Emergency Transport</h1>
        <p className="text-gray-600 mt-1">
          Request emergency medical transport with AI-powered assistance
        </p>
      </div>
      
      <Tabs defaultValue="request" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="request">Request Transport</TabsTrigger>
          <TabsTrigger value="facilities">Nearby Facilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <EmergencyTransportForm />
              
              {destination && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Selected Destination:</p>
                    <p className="text-sm text-gray-600">{destination}</p>
                  </div>
                </div>
              )}
              
              {!destination && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Need help finding a medical facility?
                  </p>
                  <Button 
                    variant="link" 
                    className="text-blue-600 p-0 h-auto text-sm"
                    onClick={() => setActiveTab('facilities')}
                  >
                    Browse nearby facilities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="facilities">
          <NearbyFacilitiesMap onSelectFacility={handleSelectFacility} />
          
          <div className="text-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('request')}
            >
              Back to Request Form
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <EmergencyTransportList />
      </div>
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>
          This emergency transport service features AI-powered risk assessment, 
          voice recognition, and real-time language translation.
        </p>
      </div>
    </div>
  );
};

export default EnhancedEmergencyTransport;