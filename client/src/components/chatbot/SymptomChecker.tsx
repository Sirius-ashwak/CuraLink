import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { 
  SendIcon, 
  ActivityIcon, 
  Heart, 
  Mic, 
  MicOff, 
  Camera, 
  Image as ImageIcon, 
  Loader2,
  X,
  MoreVertical,
  Trash2,
  Download,
  HelpCircle,
  Info
} from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Define message types
type MessageType = "user" | "bot" | "system";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  imageData?: string;         // URL for captured image data
  imageAnalysis?: string;     // Results from image analysis
}

export default function SymptomChecker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const welcomeMessage = {
    id: "welcome",
    type: "bot" as MessageType, 
    content: `Hello${user ? ', ' + user.firstName : ''}! I'm your AI Health Assistant. How can I help you today?`,
    timestamp: new Date(),
  };
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  
  // Speech recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  // Load TensorFlow model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        console.log("MobileNet model loaded successfully");
      } catch (error) {
        console.error("Failed to load MobileNet model:", error);
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (model) {
        // Dispose any tensors when component unmounts
        console.log("Cleaning up TensorFlow resources");
      }
    };
  }, []);

  // Update input field when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Scroll to bottom of messages when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Focus input on load or when camera closes
  useEffect(() => {
    if (inputRef.current && !isCameraOpen) {
      inputRef.current.focus();
    }
  }, [isCameraOpen]);
  
  // Toggle speech recognition
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
      setIsListening(true);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    setIsCameraOpen(!isCameraOpen);
  };
  
  // Clear chat history
  const clearHistory = () => {
    // Reset to just the welcome message
    setMessages([{
      ...welcomeMessage,
      id: `welcome-${Date.now()}`,
      timestamp: new Date()
    }]);
    
    toast({
      title: "Chat history cleared",
      description: "Your conversation has been reset.",
    });
  };
  
  // Save chat transcript
  const saveTranscript = () => {
    try {
      // Create a formatted text version of the chat
      const transcriptText = messages
        .filter(m => m.type !== "system") // Exclude system messages
        .map(m => {
          const sender = m.type === "user" ? "You" : "AI Health Assistant";
          const time = m.timestamp.toLocaleString();
          const analysis = m.imageAnalysis ? `\nImage Analysis: ${m.imageAnalysis}` : '';
          return `[${time}] ${sender}:${analysis}\n${m.content}\n`;
        })
        .join("\n-------------------------------------------------\n");
      
      // Create a downloadable file
      const blob = new Blob([transcriptText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-chat-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Transcript saved",
        description: "Your conversation has been downloaded as a text file.",
      });
    } catch (error) {
      console.error("Failed to save transcript:", error);
      toast({
        title: "Error",
        description: "Failed to save the transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Capture image and analyze
  const captureImage = useCallback(async () => {
    if (webcamRef.current && model) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      setIsImageAnalyzing(true);
      
      try {
        // Create an image element from the screenshot
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Run the image through the model
        const predictions = await model.classify(img);
        
        const analysisResults = predictions
          .map(p => `${p.className} (${Math.round(p.probability * 100)}% confidence)`)
          .join(', ');
        
        // Add the image message
        const imageMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          type: "user",
          content: "I've captured an image for analysis.",
          timestamp: new Date(),
          imageData: imageSrc
        };
        
        setMessages(prev => [...prev, imageMessage]);
        
        // Add typing indicator
        setMessages(prev => [
          ...prev,
          {
            id: "typing",
            type: "system",
            content: "Analyzing image...",
            timestamp: new Date(),
          },
        ]);
        
        // Prepare API request with image analysis
        const chatResponse = await fetch("/api/ai-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            message: `Analyze this image. The image analysis detected: ${analysisResults}. What health implications might this have?`,
            history: messages
              .filter(m => m.type !== "system")
              .map(m => ({
                role: m.type === "user" ? "user" : "assistant",
                content: m.content
              }))
              // Ensure history starts with a user message for Gemini API requirements
              .filter((_, index, array) => 
                index === 0 ? array[0].role === "user" : true
              )
          }),
        });
        
        if (!chatResponse.ok) {
          throw new Error(`API error: ${chatResponse.status}`);
        }
        
        const response = await chatResponse.json();
        
        // Remove typing indicator
        setMessages(prev => prev.filter(m => m.id !== "typing"));
        
        // Add bot response
        if (response && typeof response === 'object' && 'message' in response) {
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              type: "bot",
              content: response.message as string,
              timestamp: new Date(),
              imageAnalysis: analysisResults
            }
          ]);
        }
        
        // Close camera after successful analysis
        setIsCameraOpen(false);
        
      } catch (error) {
        console.error("Error analyzing image:", error);
        
        // Remove typing indicator
        setMessages(prev => prev.filter(m => m.id !== "typing"));
        
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            type: "system",
            content: "Sorry, I encountered an error while analyzing the image. Please try again.",
            timestamp: new Date()
          }
        ]);
        
        toast({
          title: "Error",
          description: "Failed to analyze the image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsImageAnalyzing(false);
      }
    }
  }, [webcamRef, model, messages, toast]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Create a new user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInput("");
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Add typing indicator
      setMessages(prev => [
        ...prev,
        {
          id: "typing",
          type: "system",
          content: "Analyzing symptoms...",
          timestamp: new Date(),
        },
      ]);
      
      // Make API request to symptom checker
      console.log("Sending chat request to API", {
        message: userMessage.content,
        historyLength: messages.filter(m => m.type !== "system").length
      });
      
      const chatResponse = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          history: messages
            .filter(m => m.type !== "system")
            .map(m => ({
              role: m.type === "user" ? "user" : "assistant",
              content: m.content
            }))
            // Ensure history starts with a user message for Gemini API requirements
            .filter((_, index, array) => 
              index === 0 ? array[0].role === "user" : true
            )
        }),
      });
      
      if (!chatResponse.ok) {
        console.error("API error:", chatResponse.status, await chatResponse.text());
        throw new Error(`API error: ${chatResponse.status}`);
      }
      
      const response = await chatResponse.json();
      console.log("API response:", response);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      
      // Add bot response
      if (response && typeof response === 'object' && 'message' in response) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: response.message as string,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.error("Unexpected response format:", response);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: "system",
          content: "Sorry, I couldn't process your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Focus back on input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const renderMessageContent = (content: string) => {
    // Enhanced markdown-like rendering with proper spacing and formatting
    // First, replace **text** patterns with styled spans we can format better
    const processedContent = content.replace(/\*\*(.*?)\*\*/g, '{{BOLD}}$1{{/BOLD}}');
    
    return processedContent.split("\n").map((line, i) => {
      // Skip empty lines but preserve space
      if (line.trim() === '') {
        return <div key={i} className="h-2"></div>;
      }
      
      // Process the line to handle bold markers
      const processLine = (text: string) => {
        const parts = text.split(/({{BOLD}}.*?{{\/BOLD}})/g);
        return parts.map((part, partIndex) => {
          if (part.startsWith('{{BOLD}}') && part.endsWith('{{/BOLD}}')) {
            const boldText = part.replace('{{BOLD}}', '').replace('{{/BOLD}}', '');
            return <span key={partIndex} className="font-bold text-blue-300">{boldText}</span>;
          }
          return <span key={partIndex}>{part}</span>;
        });
      };
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={i} className="flex items-start mb-2">
            <span className="inline-block w-6 text-blue-400 flex-shrink-0">•</span>
            <span className="flex-1">{processLine(line.trim().substring(1).trim())}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = line.trim().match(/^(\d+\.|\d+\))\s+(.+)$/);
      if (numberedMatch) {
        return (
          <div key={i} className="flex items-start mb-2">
            <span className="inline-block w-8 text-blue-400 flex-shrink-0">{numberedMatch[1]}</span>
            <span className="flex-1">{processLine(numberedMatch[2])}</span>
          </div>
        );
      }
      
      // Handle headers - use blue theme
      if (line.startsWith("#")) {
        return (
          <h3 key={i} className="font-semibold mt-3 mb-2 text-blue-400">
            {processLine(line.substring(1).trim())}
          </h3>
        );
      }
      
      // Regular text with proper margin and blue accent for first sentence
      if (i === 0 || line.trim().startsWith("I am an AI") || line.trim().startsWith("Please note")) {
        return <p key={i} className="mb-3 text-blue-100">{processLine(line)}</p>;
      }
      
      return <p key={i} className="mb-2">{processLine(line)}</p>;
    });
  };

  // Determine if we should add gradient animation based on message type
  const getMessageClasses = (message: ChatMessage) => {
    if (message.type === "bot") {
      return "from-indigo-950/40 via-blue-950/30 to-indigo-950/40 bg-gradient-to-r border-indigo-900/50";
    }
    if (message.type === "system") {
      return "from-gray-900/40 via-gray-900/30 to-gray-900/40 bg-gradient-to-r border-gray-800/50";
    }
    return "";
  };
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-indigo-900/40 backdrop-blur-sm border-b border-indigo-900/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Heart className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
          </div>
          <div>
            <h2 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-200">AI Health Assistant</h2>
            <p className="text-xs text-blue-200/80">Get answers to your health questions</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-blue-950/50 text-blue-200"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border border-blue-900/50">
            <DropdownMenuItem className="text-white hover:bg-blue-900/30 cursor-pointer" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear History
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-blue-900/30 cursor-pointer" onClick={saveTranscript}>
              <Download className="h-4 w-4 mr-2" /> Save Transcript
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-blue-900/30" />
            <DropdownMenuItem className="text-white hover:bg-blue-900/30 cursor-pointer" onClick={() => setIsHelpOpen(true)}>
              <HelpCircle className="h-4 w-4 mr-2" /> Help & FAQ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Webcam Modal */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 p-4 rounded-xl border border-blue-900/50 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Image Analysis</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleCamera}
                className="hover:bg-gray-800 text-gray-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-black mb-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "environment"
                }}
                className="w-full h-auto"
              />
              {isImageAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <ActivityIcon className="h-8 w-8 mx-auto animate-spin mb-2" />
                    <p>Analyzing...</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              Capture an image of a visible health condition for AI analysis. 
              Position the affected area in good lighting.
            </p>
            
            <div className="flex space-x-3">
              <Button 
                onClick={toggleCamera} 
                variant="outline" 
                className="flex-1 border-gray-700"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button 
                onClick={captureImage} 
                disabled={isImageAnalyzing || !model}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat messages with enhanced styling */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gradient-to-b from-gray-950 to-gray-900 relative">
        {/* Background animation effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>
        {messages.map((message) => (
          <div key={message.id} className={`${getMessageClasses(message)}`}>
            {message.type === "system" ? (
              <div className="w-full px-4 py-3 my-2">
                <div className="bg-gray-900 bg-opacity-50 text-gray-400 text-sm italic border border-gray-800/50 px-4 py-3 rounded-lg max-w-md mx-auto">
                  {renderMessageContent(message.content)}
                  <div className="text-xs opacity-70 mt-2 text-right pr-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`w-full flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                {message.type === "bot" && (
                  <div className="flex-shrink-0 mr-3 self-end">
                    <Avatar className="w-9 h-9 border-2 border-indigo-500/60 p-0.5 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-700 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                <div className={`py-3 px-4 rounded-2xl ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none max-w-md shadow-lg shadow-blue-900/20"
                    : "bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 border border-indigo-900/30 shadow-lg shadow-indigo-900/10 rounded-tl-none max-w-lg"
                }`}
                >
                  {message.imageData && (
                    <div className="mb-2">
                      <img 
                        src={message.imageData} 
                        alt="Captured for analysis" 
                        className="rounded-lg max-h-60 w-auto mx-auto" 
                      />
                      {message.imageAnalysis && (
                        <div className="mt-2 text-xs italic text-gray-300">
                          <p>Analysis: {message.imageAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {renderMessageContent(message.content)}
                  <div className="text-xs opacity-70 mt-2 text-right pr-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {message.type === "user" && (
                  <div className="flex-shrink-0 ml-3 self-end">
                    <Avatar className="w-9 h-9 border-2 border-blue-600/60 p-0.5 shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        {user?.firstName?.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Enhanced input area */}
      <div className="border-t border-indigo-900/30 p-4 bg-gradient-to-t from-gray-950 via-gray-900 to-gray-900 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          {/* Additional input options */}
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              size="sm"
              variant={isListening ? "default" : "outline"}
              className={`rounded-full px-4 py-2 ${isListening 
                ? 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white border-0 shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
                : 'border-indigo-900/50 text-indigo-300 hover:bg-indigo-950/30 hover:text-indigo-200 hover:border-indigo-700/50'}`}
              onClick={toggleListening}
              disabled={!browserSupportsSpeechRecognition || isLoading}
              title={browserSupportsSpeechRecognition ? "Use voice to describe symptoms" : "Voice recognition not supported in your browser"}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 mr-2 animate-pulse drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" /> Voice Input
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 border-indigo-900/50 text-indigo-300 hover:bg-indigo-950/30 hover:text-indigo-200 hover:border-indigo-700/50"
              onClick={toggleCamera}
              disabled={isLoading}
              title="Upload image for analysis"
            >
              <Camera className="w-4 h-4 mr-2" /> Image Analysis
            </Button>
          </div>
          
          {/* Main input field */}
          <div className="flex bg-gradient-to-r from-gray-900 to-gray-950 rounded-xl border border-indigo-900/40 overflow-hidden shadow-xl relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Voice indicator */}
            {isListening && (
              <div className="pl-3 flex items-center z-10">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.7)]"></div>
                  <div className="w-1.5 h-7 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.7)]"></div>
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.7)]"></div>
                </div>
              </div>
            )}
            
            <Input
              ref={inputRef}
              placeholder={isListening ? "Listening to your voice..." : "Describe your symptoms..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 py-6 px-4 z-10"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              className={`rounded-none px-5 z-10 ${isLoading 
                ? 'bg-indigo-800/50 text-indigo-200' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]'}`}
            >
              {isLoading ? (
                <ActivityIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 text-xs text-blue-300/70">
            <p className="max-w-sm text-center sm:text-left mb-2 sm:mb-0">
              This AI assistant provides general health information. Always consult with a healthcare professional for medical advice.
            </p>
            <div className="flex items-center justify-center sm:justify-end space-x-1">
              <p>Powered by</p>
              <div className="bg-blue-600/20 border border-blue-900/30 rounded-md px-1.5 py-0.5 text-blue-300 font-medium">
                TensorFlow.js
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help & FAQ Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="bg-gray-900 border border-blue-900/50 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-blue-300 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> AI Health Assistant Help & FAQ
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Learn how to effectively use the AI Health Assistant to get the most out of your experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-blue-200">Getting Started</h3>
              <p className="text-gray-300 text-sm">
                The AI Health Assistant uses artificial intelligence to provide information about health concerns, symptoms, and general medical questions. Simply type your question or describe your symptoms in the chat box and press enter.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-blue-200">Features</h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="bg-gray-800 rounded-lg p-3 border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-100">Voice Input</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Click the "Voice Input" button to speak your symptoms or questions instead of typing them.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-100">Image Analysis</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Use the "Image Analysis" button to capture and analyze images of visible symptoms using AI technology.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-100">Save Transcript</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Save your conversation as a text file for future reference or to share with healthcare providers.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-100">Clear History</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Clear your conversation history and start fresh. This ensures your privacy when using shared devices.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-blue-200">Tips for Better Results</h3>
              <ul className="space-y-2 text-gray-300 text-sm pl-5 list-disc">
                <li>Be specific when describing symptoms (location, duration, severity)</li>
                <li>Mention relevant medical history when appropriate</li>
                <li>For image analysis, ensure good lighting and clear focus</li>
                <li>Ask follow-up questions to get more detailed information</li>
                <li>Use voice input in a quiet environment for better recognition</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-blue-200">Important Disclaimer</h3>
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-blue-100 text-sm flex gap-2">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p>
                  The AI Health Assistant provides general health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600">
                Got it
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}