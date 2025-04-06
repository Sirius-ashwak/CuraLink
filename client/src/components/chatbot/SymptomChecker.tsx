import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { SendIcon, ActivityIcon, Heart } from "lucide-react";

// Define message types
type MessageType = "user" | "bot" | "system";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

export default function SymptomChecker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to the AI Health Assistant! Describe your symptoms, and I'll help identify possible conditions and when you should seek medical attention.",
      timestamp: new Date(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom of messages when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
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
      return "from-blue-900/20 via-blue-800/10 to-blue-900/20 bg-gradient-to-r";
    }
    if (message.type === "system") {
      return "from-gray-800/30 via-gray-800/20 to-gray-800/30 bg-gradient-to-r";
    }
    return "";
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="bg-blue-900 bg-opacity-30 backdrop-blur-sm border-b border-blue-900/50 px-4 py-3 flex items-center">
        <div className="mr-3 bg-blue-600 p-2 rounded-full">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-white">AI Health Assistant</h2>
          <p className="text-xs text-blue-200">Get answers to your health questions</p>
        </div>
      </div>
      
      {/* Chat messages with enhanced styling */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gradient-to-b from-gray-950 to-gray-900">
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
                    <Avatar className="w-9 h-9 border-2 border-blue-500 p-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                <div className={`py-3 px-4 rounded-2xl ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none max-w-md"
                    : "bg-gray-900 text-gray-100 border border-blue-900/50 shadow-lg shadow-blue-900/10 rounded-tl-none max-w-lg"
                }`}
                >
                  {renderMessageContent(message.content)}
                  <div className="text-xs opacity-70 mt-2 text-right pr-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {message.type === "user" && (
                  <div className="flex-shrink-0 ml-3 self-end">
                    <Avatar className="w-9 h-9 border-2 border-blue-600 p-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                        {user?.firstName?.charAt(0) || "U"}
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
      <div className="border-t border-blue-900/30 p-4 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex bg-gray-800 rounded-xl border border-blue-900/30 overflow-hidden shadow-lg">
            <Input
              ref={inputRef}
              placeholder="Describe your symptoms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 py-6 px-4"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              className={`rounded-none px-4 ${isLoading 
                ? 'bg-blue-800/50 text-blue-200' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'}`}
            >
              {isLoading ? (
                <ActivityIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-blue-300/70 mt-3 max-w-sm mx-auto">
            This AI assistant provides general health information. Always consult with a healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}