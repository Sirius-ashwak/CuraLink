import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ambulance, AlertTriangle } from 'lucide-react';
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

  // Demo mode - simulate location detection
  const handleLocationDetection = () => {
    toast({
      title: "Demo Mode",
      description: "Location detection is simulated in demo mode.",
    });
    
    // Simulate location detection
    setTimeout(() => {
      setLocation("123 Main Street, San Francisco, CA 94103");
    }, 500);
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
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Transport Requested",
        description: "Your emergency transport request has been submitted successfully.",
      });
      onTransportRequested();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Reason for Transport
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g., Medical emergency, scheduled surgery"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Pickup Location
        </label>
        <div className="flex gap-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your current address"
            className="flex-grow"
          />
          <Button 
            type="button" 
            variant="outline" 
            className="flex-shrink-0"
            onClick={handleLocationDetection}
          >
            Detect
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Destination
        </label>
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Hospital or clinic name/address"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Additional Notes
        </label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any other important information (medical conditions, mobility needs, etc.)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Urgency Level
          </label>
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
          <label className="block text-sm font-medium">
            Vehicle Type
          </label>
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
          <>
            <Ambulance className="mr-2 h-4 w-4" />
            Request Emergency Transport
          </>
        )}
      </Button>
      
      <div className="text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
          <span>For life-threatening emergencies, call emergency services directly</span>
        </div>
      </div>
    </form>
  );
};

export default EnhancedEmergencyForm;