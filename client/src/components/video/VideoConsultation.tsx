import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoRoom } from './VideoRoom';
import { Phone, VideoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface VideoConsultationProps {
  appointmentId: number;
  patientName: string;
  doctorName: string;
  onEndCall: () => void;
}

export default function VideoConsultation({ 
  appointmentId, 
  patientName, 
  doctorName, 
  onEndCall 
}: VideoConsultationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'connected' | 'ended'>('waiting');
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  
  const isDoctor = user?.role === 'doctor';
  const displayName = isDoctor ? doctorName : patientName;
  const otherPartyName = isDoctor ? patientName : doctorName;

  // Create room in Firestore and listen for updates
  useEffect(() => {
    const roomId = `appointment-${appointmentId}`;
    setRoomName(roomId);

    // Reference to the appointment document in Firestore
    const docRef = doc(db, 'video-calls', roomId);
    
    // Set initial document (if doctor) or just mark that patient is here
    const initializeRoom = async () => {
      try {
        if (isDoctor) {
          // Doctor creates/updates the room
          await setDoc(docRef, {
            appointmentId,
            roomName: roomId,
            doctorPresent: true,
            patientPresent: false,
            startedAt: new Date().toISOString(),
            status: 'waiting'
          }, { merge: true });
          
          // Update appointment status in our database
          await apiRequest(`/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 
              status: 'in-progress',
              callUrl: `/video-call/${appointmentId}`
            }),
          } as any);
        } else {
          // Patient joins the room
          await setDoc(docRef, {
            patientPresent: true,
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error initializing video room:', error);
        toast({
          title: 'Connection Error',
          description: 'Could not initialize video call room',
          variant: 'destructive'
        });
      }
    };
    
    initializeRoom();
    
    // Listen for changes in the room document
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      
      if (data) {
        // Check if other party is present
        if (isDoctor && data.patientPresent) {
          setOtherPartyJoined(true);
          if (status === 'waiting') {
            setStatus('connecting');
          }
        } else if (!isDoctor && data.doctorPresent) {
          setOtherPartyJoined(true);
          if (status === 'waiting') {
            setStatus('connecting');
          }
        }
        
        // Check if call was ended by the other party
        if (data.status === 'ended') {
          setStatus('ended');
          toast({
            title: 'Call Ended',
            description: `${isDoctor ? 'Patient' : 'Doctor'} has ended the call`,
          });
          
          // Exit call after a delay
          setTimeout(() => {
            onEndCall();
          }, 3000);
        }
      }
    });
    
    // Clean up: mark user as not present when leaving
    return () => {
      unsubscribe();
      
      const updatePresence = async () => {
        try {
          if (isDoctor) {
            await setDoc(docRef, {
              doctorPresent: false,
              status: 'ended'
            }, { merge: true });
          } else {
            await setDoc(docRef, {
              patientPresent: false,
              status: 'ended'
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error updating presence on unmount:', error);
        }
      };
      
      updatePresence();
    };
  }, [appointmentId, isDoctor, onEndCall, status, toast]);

  // Handle starting the call
  const startCall = () => {
    setStatus('connected');
  };

  // Handle ending the call
  const endCall = async () => {
    try {
      // Update Firestore
      const docRef = doc(db, 'video-calls', roomName);
      await setDoc(docRef, {
        status: 'ended'
      }, { merge: true });
      
      // Update appointment status
      await apiRequest(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      } as any);
      
      // Notify user
      toast({
        title: 'Call Ended',
        description: 'You have ended the video consultation',
      });
      
      // Return to dashboard
      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: 'Error',
        description: 'Failed to properly end the call',
        variant: 'destructive'
      });
    }
  };

  // If the call is ready to connect
  if (status === 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="p-4 bg-card shadow-sm border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Video Consultation</h1>
            <div>
              <Button variant="destructive" onClick={endCall}>
                <Phone className="mr-2 h-4 w-4 rotate-[135deg]" />
                End Call
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <VideoRoom roomName={roomName} onLeave={endCall} />
        </main>
      </div>
    );
  }

  // Waiting or connecting state
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <VideoIcon className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-center">Video Consultation</CardTitle>
          <CardDescription className="text-center">
            Appointment #{appointmentId} with {otherPartyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            {status === 'waiting' ? (
              otherPartyJoined ? (
                <div>
                  <p className="text-lg font-medium mb-4">{otherPartyName} has joined</p>
                  <p>Ready to start the consultation?</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-4">Waiting for {otherPartyName}</p>
                  <p>Please wait for the other party to join...</p>
                </div>
              )
            ) : status === 'connecting' ? (
              <div>
                <p className="text-lg font-medium mb-4">Ready to Connect</p>
                <p>Click the button below to join the video call.</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-4">Call Ended</p>
                <p>Returning to dashboard...</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onEndCall}>
            Cancel
          </Button>
          {(status === 'waiting' && otherPartyJoined) || status === 'connecting' ? (
            <Button onClick={startCall}>
              <VideoIcon className="mr-2 h-4 w-4" />
              Join Call
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}