import React, { useEffect, useRef, useState } from 'react';
import { connect, Room, LocalTrack, RemoteParticipant, LocalParticipant, LocalVideoTrack } from 'twilio-video';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Mic, MicOff, Monitor, Phone, Video, VideoOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TokenResponse {
  token: string;
}

interface VideoRoomProps {
  roomName: string;
  onLeave?: () => void;
}

export function VideoRoom({ roomName, onLeave }: VideoRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localMediaRef = useRef<LocalTrack[]>([]);
  const screenTrackRef = useRef<LocalTrack | null>(null);

  // Fetch token from server
  useEffect(() => {
    const fetchToken = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

        const identity = `${user.firstName} ${user.lastName}`;
        const response = await apiRequest(`/api/video/token`, {
          method: 'POST',
          body: JSON.stringify({ identity, roomName }),
        } as any);

        if (response && typeof response === 'object' && 'token' in response) {
          setToken(response.token as string);
        } else {
          throw new Error('Invalid token response');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Failed to connect to video service. Please try again later.');
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomName, user]);

  // Connect to room when token is available
  useEffect(() => {
    if (!token) return;

    const connectToRoom = async () => {
      try {
        // Connect to the room with audio and video enabled
        const videoRoom = await connect(token, {
          audio: true,
          video: { width: 640, height: 480 },
          name: roomName,
        });

        // Save reference to the room
        setRoom(videoRoom);
        setLoading(false);

        // Add existing participants
        setParticipants(Array.from(videoRoom.participants.values()));

        // Set up event listeners for participants joining and leaving
        videoRoom.on('participantConnected', (participant) => {
          setParticipants((prevParticipants) => [...prevParticipants, participant]);
          toast({
            title: 'Participant joined',
            description: `${participant.identity} has joined the call`,
          });
        });

        videoRoom.on('participantDisconnected', (participant) => {
          setParticipants((prevParticipants) =>
            prevParticipants.filter((p) => p !== participant)
          );
          toast({
            title: 'Participant left',
            description: `${participant.identity} has left the call`,
          });
        });

        // Add local tracks to preview
        attachLocalTracks(videoRoom.localParticipant);

        // Clean up when component unmounts
        return () => {
          if (videoRoom) {
            videoRoom.disconnect();
          }
        };
      } catch (err) {
        console.error('Error connecting to room:', err);
        setError('Failed to connect to video room. Please try again later.');
        setLoading(false);
      }
    };

    connectToRoom();
  }, [token, roomName, toast]);

  // Attach local tracks to video element
  const attachLocalTracks = (participant: LocalParticipant) => {
    const tracks = Array.from(participant.videoTracks.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

    // Store tracks reference for muting/unmuting
    localMediaRef.current = Array.from(participant.tracks.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null) as LocalTrack[];

    if (tracks.length > 0 && localVideoRef.current) {
      tracks[0].attach(localVideoRef.current);
    }
  };

  // Toggle audio mute
  const toggleMute = () => {
    if (!room) return;

    const audioTrack = localMediaRef.current.find(track => track.kind === 'audio');
    if (audioTrack) {
      if (isMuted) {
        audioTrack.enable();
      } else {
        audioTrack.disable();
      }
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (!room) return;

    const videoTrack = localMediaRef.current.find(track => track.kind === 'video');
    if (videoTrack) {
      if (isVideoOff) {
        videoTrack.enable();
      } else {
        videoTrack.disable();
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!room) return;

    if (!isScreenSharing) {
      try {
        // @ts-ignore - MediaDevices types issue with getDisplayMedia
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const screenTrack = stream.getTracks()[0];
        // @ts-ignore - Type mismatches in the Twilio library
        const localScreenTrack = await room.localParticipant.publishTrack(screenTrack);
        
        // @ts-ignore - Type mismatches in the Twilio library
        screenTrackRef.current = localScreenTrack;
        setIsScreenSharing(true);
        
        // Stop sharing when the user stops sharing via the browser UI
        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast({
          title: 'Screen sharing failed',
          description: 'Failed to share your screen. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      stopScreenSharing();
    }
  };
  
  // Helper function to stop screen sharing
  const stopScreenSharing = () => {
    if (screenTrackRef.current) {
      room?.localParticipant.unpublishTrack(screenTrackRef.current);
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }
  };

  // Leave the room
  const leaveRoom = () => {
    if (screenTrackRef.current) {
      stopScreenSharing();
    }
    
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    
    if (onLeave) {
      onLeave();
    }
  };

  // Create participant videos
  const renderParticipant = (participant: RemoteParticipant) => {
    return (
      <div 
        key={participant.sid} 
        className="relative flex flex-col items-center bg-black rounded-lg overflow-hidden shadow-lg"
      >
        <div className="w-full h-48 md:h-64 relative">
          <ParticipantVideo participant={participant} />
        </div>
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-white text-sm">
          {participant.identity}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Connecting to video call...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={onLeave}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local video preview */}
          <div className="relative flex flex-col items-center bg-black rounded-lg overflow-hidden shadow-lg">
            <div className="w-full h-48 md:h-64 relative">
              <video 
                ref={localVideoRef}
                autoPlay
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <p className="text-white">Camera Off</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-white text-sm">
              You (Self View)
            </div>
          </div>

          {/* Remote participants */}
          {participants.map(renderParticipant)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-card p-4">
        <div className="flex justify-center gap-4">
          <Button 
            variant={isMuted ? "destructive" : "secondary"} 
            size="icon" 
            onClick={toggleMute}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          
          <Button 
            variant={isVideoOff ? "destructive" : "secondary"} 
            size="icon" 
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>
          
          <Button 
            variant={isScreenSharing ? "destructive" : "secondary"} 
            size="icon" 
            onClick={toggleScreenShare}
          >
            <Monitor />
          </Button>
          
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={leaveRoom}
          >
            <Phone className="rotate-[135deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component to render participant video
function ParticipantVideo({ participant }: { participant: RemoteParticipant }) {
  const [videoTrack, setVideoTrack] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Find the participant's video track
    const trackPublication = Array.from(participant.videoTracks.values())[0];
    if (trackPublication && trackPublication.track) {
      setVideoTrack(trackPublication.track);
    }

    // Set up listeners for when video tracks are enabled/disabled
    const trackSubscribed = (track: any) => {
      if (track.kind === 'video') {
        setVideoTrack(track);
      }
    };

    const trackUnsubscribed = (track: any) => {
      if (track.kind === 'video') {
        setVideoTrack(null);
      }
    };

    participant.on('trackSubscribed', trackSubscribed);
    participant.on('trackUnsubscribed', trackUnsubscribed);

    return () => {
      participant.off('trackSubscribed', trackSubscribed);
      participant.off('trackUnsubscribed', trackUnsubscribed);
    };
  }, [participant]);

  // Attach video track to the video element when it changes
  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach(videoRef.current);
      };
    }
  }, [videoTrack]);

  return (
    <>
      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
      {!videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-white">Video Off</p>
        </div>
      )}
    </>
  );
}