import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Globe, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedEmergencyFormProps {
  onTransportRequested: () => void;
  patientId: string;
}

const EnhancedEmergencyForm: React.FC<EnhancedEmergencyFormProps> = ({ 
  onTransportRequested, 
  patientId 
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<string>('medium');
  const [vehicleType, setVehicleType] = useState<string>('ambulance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock function for voice input (would use real speech recognition in production)
  const handleVoiceInput = () => {
    toast({
      title: "Voice Input",
      description: "Voice input is not available in the demo version.",
    });
  };

  // Mock function for translation (would use real translation API in production)
  const handleTranslate = () => {
    toast({
      title: "Translation",
      description: "Translation is not available in the demo version.",
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for transport",
        variant: "destructive",
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Missing information",
        description: "Please provide a pickup location",
        variant: "destructive",
      });
      return;
    }
    
    if (!destination) {
      toast({
        title: "Missing information",
        description: "Please provide a destination",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create the transport request payload
    const transportRequest = {
      patientId: parseInt(patientId),
      reason,
      pickupLocation: location,
      destination,
      notes: additionalNotes,
      urgency: urgencyLevel,
      vehicleType,
    };

    // Make the API request
    fetch('/api/emergency-transport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transportRequest)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      toast({
        title: "Transport Requested",
        description: "Your emergency transport request has been submitted successfully.",
      });
      onTransportRequested();
    })
    .catch(error => {
      console.error('Error submitting transport request:', error);
      toast({
        title: "Request Failed",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Reason for Transport
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Medical emergency, scheduled surgery"
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleVoiceInput}
                      className="h-8 w-8"
                    >
                      <Mic className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Speak reason</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleTranslate}
                      className="h-8 w-8"
                    >
                      <Globe className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Translate text</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Pickup Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Your current address"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Destination</label>
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Hospital or clinic name/address"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Additional Notes</label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any other important information (medical conditions, mobility needs, etc.)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Urgency Level</label>
          <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select urgency level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Vehicle Type</label>
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambulance">Ambulance</SelectItem>
              <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
              <SelectItem value="medical_car">Medical Car</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting Transport...
          </>
        ) : (
          <>Request Emergency Transport</>
        )}
      </Button>
    </form>
  );
};

export default EnhancedEmergencyForm;