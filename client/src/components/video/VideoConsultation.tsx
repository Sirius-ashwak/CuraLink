import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface VideoConsultationProps {
  appointmentId: number;
  patientName?: string;
  doctorName?: string;
  onEndCall: () => void;
}

export default function VideoConsultation({
  appointmentId,
  patientName,
  doctorName,
  onEndCall,
}: VideoConsultationProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  // This would be replaced with actual WebRTC implementation using Twilio SDK
  useEffect(() => {
    let localStream: MediaStream | null = null;
    
    const initializeMedia = async () => {
      try {
        // Request access to camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        // Store the stream for cleanup
        localStream = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Simulate connection delay
        setTimeout(() => {
          setConnectionStatus("connected");
          toast({
            title: "Connected",
            description: `Your consultation has started.`,
          });
        }, 2000);
        
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setConnectionStatus("error");
        toast({
          title: "Connection Error",
          description: "Failed to access camera or microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    };
    
    initializeMedia();
    
    // Clean up media streams when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [toast]);
  
  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleCamera = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  return (
    <div className="fixed inset-0 bg-text-primary z-50 flex flex-col">
      <div className="flex-grow flex flex-col sm:flex-row">
        {/* Main Video (Doctor) */}
        <div className="flex-grow bg-text-primary relative flex items-center justify-center overflow-hidden">
          {connectionStatus === "connecting" ? (
            <div className="text-center text-neutral-light">
              <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="mt-2">Establishing secure connection...</p>
            </div>
          ) : connectionStatus === "error" ? (
            <div className="text-center text-neutral-light">
              <span className="material-icons text-6xl">error</span>
              <p className="mt-2">Failed to connect to the video call.</p>
              <Button onClick={onEndCall} variant="outline" className="mt-4">
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {doctorName || "Healthcare Provider"}
              </div>
            </>
          )}
          
          {/* Patient Video (Small) */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-neutral-dark rounded-lg overflow-hidden shadow-lg sm:w-48 sm:h-36 border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-text-primary bg-opacity-80 text-white">
                <span className="material-icons">videocam_off</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-2 py-0.5 rounded text-xs">
              {patientName || "You"}
            </div>
          </div>
          
          {/* Chat panel (if open) */}
          {isChatOpen && (
            <div className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-lg z-10 flex flex-col">
              <div className="p-3 border-b border-neutral-dark flex justify-between items-center">
                <h3 className="font-medium">Chat</h3>
                <button onClick={toggleChat}>
                  <span className="material-icons text-text-secondary">close</span>
                </button>
              </div>
              <div className="flex-grow p-3 overflow-y-auto">
                <div className="text-center text-text-secondary text-sm py-4">
                  Messages will appear here
                </div>
              </div>
              <div className="p-3 border-t border-neutral-dark">
                <div className="flex">
                  <input
                    type="text"
                    className="flex-grow border border-neutral-dark rounded-l p-2"
                    placeholder="Type a message..."
                  />
                  <button className="bg-primary text-white p-2 rounded-r">
                    <span className="material-icons">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Call Controls */}
      <div className="bg-text-primary p-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button
            className="flex flex-col items-center text-white"
            onClick={toggleMute}
          >
            <div
              className={`w-12 h-12 rounded-full ${
                isMuted ? "bg-error" : "bg-text-primary bg-opacity-30"
              } flex items-center justify-center mb-1 hover:bg-opacity-40`}
            >
              <span className="material-icons">{isMuted ? "mic_off" : "mic"}</span>
            </div>
            <span className="text-xs">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button
            className="flex flex-col items-center text-white"
            onClick={toggleCamera}
          >
            <div
              className={`w-12 h-12 rounded-full ${
                !isCameraOn ? "bg-error" : "bg-text-primary bg-opacity-30"
              } flex items-center justify-center mb-1 hover:bg-opacity-40`}
            >
              <span className="material-icons">
                {isCameraOn ? "videocam" : "videocam_off"}
              </span>
            </div>
            <span className="text-xs">{isCameraOn ? "Camera Off" : "Camera On"}</span>
          </button>
          <button
            className="flex flex-col items-center text-white"
            onClick={toggleChat}
          >
            <div
              className={`w-12 h-12 rounded-full ${
                isChatOpen ? "bg-primary" : "bg-text-primary bg-opacity-30"
              } flex items-center justify-center mb-1 hover:bg-opacity-40`}
            >
              <span className="material-icons">chat</span>
            </div>
            <span className="text-xs">Chat</span>
          </button>
          <button
            className="flex flex-col items-center text-white"
            onClick={onEndCall}
          >
            <div className="w-12 h-12 rounded-full bg-error flex items-center justify-center mb-1 hover:bg-error-dark">
              <span className="material-icons">call_end</span>
            </div>
            <span className="text-xs">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
