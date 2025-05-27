import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Mic, Globe, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedEmergencyFormProps {
  onTransportRequested: () => void;
  patientId: string;
}

// Mock function - would be replaced with actual API call
const getPatientLocation = () => {
  return { lat: 40.7128, lng: -74.0060, address: "123 Main St, New York, NY 10001" };
};

const EnhancedEmergencyForm: React.FC<EnhancedEmergencyFormProps> = ({ 
  onTransportRequested, 
  patientId 
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [location, setLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<string>('medium');
  const [vehicleType, setVehicleType] = useState<string>('ambulance');
  const [automaticRiskLevel, setAutomaticRiskLevel] = useState<string | null>(null);
  const [predictedPriority, setPredictedPriority] = useState<string | null>(null);

  // Effect to fetch user's location
  useEffect(() => {
    const patientLocation = getPatientLocation();
    setLocation(patientLocation.address);
  }, []);

  // Mutation for voice recognition
  const voiceRecognitionMutation = useMutation({
    mutationFn: async (audioData: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioData);
      
      const response = await apiRequest('/api/voice-assistant/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    },
    onSuccess: (data) => {
      setReason(data.text);
      // After voice recognition, analyze the symptoms
      if (data.text) {
        symptomAnalysisMutation.mutate(data.text);
      }
    },
    onError: () => {
      toast({
        title: "Voice recognition failed",
        description: "Please try again or type your symptoms",
        variant: "destructive",
      });
    }
  });

  // Mutation for symptom analysis and risk prediction
  const symptomAnalysisMutation = useMutation({
    mutationFn: async (symptomsText: string) => {
      const response = await apiRequest('/api/predictive-monitoring/analyze-symptoms', {
        method: 'POST',
        body: JSON.stringify({ symptoms: symptomsText, patientId }),
      });
      
      return response;
    },
    onSuccess: (data) => {
      // Update the risk level based on the analysis
      if (data.riskLevel) {
        setAutomaticRiskLevel(data.riskLevel);
        // Auto-select urgency based on risk
        if (data.riskLevel === 'high') {
          setUrgencyLevel('high');
          setPredictedPriority('high');
        } else if (data.riskLevel === 'medium') {
          setPredictedPriority('medium');
        } else {
          setPredictedPriority('low');
        }
      }
    }
  });

  // Mutation for language translation
  const translationMutation = useMutation({
    mutationFn: async (text: string) => {
      // First detect the language
      const detectResponse = await apiRequest('/api/translation/detect', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      
      // Then translate to English if not already in English
      if (detectResponse.language !== 'en') {
        setDetectedLanguage(detectResponse.language);
        const translateResponse = await apiRequest('/api/translation/text', {
          method: 'POST',
          body: JSON.stringify({ 
            text, 
            sourceLanguage: detectResponse.language, 
            targetLanguage: 'en' 
          }),
        });
        
        return translateResponse.translatedText;
      }
      
      return text;
    },
    onSuccess: (translatedText) => {
      if (translatedText !== reason) {
        setTranslatedText(translatedText);
        // Also analyze the translated symptoms
        symptomAnalysisMutation.mutate(translatedText);
      }
      setIsTranslating(false);
    },
    onError: () => {
      setIsTranslating(false);
      toast({
        title: "Translation failed",
        description: "Please try again or continue in your current language",
        variant: "destructive",
      });
    }
  });

  // Mutation for requesting emergency transport
  const requestTransportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/emergency-transport', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          reason: translatedText || reason,
          pickupLocation: location,
          destination,
          notes: additionalNotes,
          urgencyLevel,
          vehicleType,
          predictedRiskLevel: automaticRiskLevel
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Transport requested",
        description: "Emergency transport has been requested successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-transport'] });
      onTransportRequested();
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Failed to request emergency transport. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        voiceRecognitionMutation.mutate(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      });
      
      mediaRecorder.start();
      
      // Record for 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access and try again",
        variant: "destructive",
      });
    }
  };

  // Handle translate text
  const handleTranslate = () => {
    if (reason.trim()) {
      setIsTranslating(true);
      translationMutation.mutate(reason);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason && !translatedText) {
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
    
    requestTransportMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Reason for Transport
          {automaticRiskLevel === 'high' && (
            <span className="ml-2 text-red-500 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              High Risk Detected
            </span>
          )}
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
                      onClick={handleStartRecording}
                      disabled={isRecording || voiceRecognitionMutation.isPending}
                      className="h-8 w-8"
                    >
                      {isRecording || voiceRecognitionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Mic className="h-4 w-4 text-gray-500" />
                      )}
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
                      disabled={!reason || isTranslating}
                      className="h-8 w-8"
                    >
                      {isTranslating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Globe className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Translate text</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        {translatedText && detectedLanguage && (
          <div className="text-sm text-muted-foreground">
            <p>Translated from {detectedLanguage}: {translatedText}</p>
          </div>
        )}
        
        {predictedPriority && (
          <div className={`text-sm ${
            predictedPriority === 'high' 
              ? 'text-red-500' 
              : predictedPriority === 'medium' 
                ? 'text-amber-500' 
                : 'text-green-500'
          }`}>
            <p>AI assessment suggests {predictedPriority} priority based on symptoms</p>
          </div>
        )}
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
        disabled={requestTransportMutation.isPending}
      >
        {requestTransportMutation.isPending ? (
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