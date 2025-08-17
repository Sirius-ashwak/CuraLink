import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmergencyTransportMapboxDemo from '@/components/emergencyTransport/EmergencyTransportMapboxDemo';

const MapboxEmergencyPage: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/emergency-transport')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Emergency Transport
          </Button>
        </div>

        {/* Main Content */}
        <EmergencyTransportMapboxDemo />
      </div>
    </div>
  );
};

export default MapboxEmergencyPage;
