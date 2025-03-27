import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

// Types for chat messages
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
      const response = await apiRequest(
        "POST",
        "/api/symptom-checker",
        { message: userMessage.content, userId: user?.id }
      );
      
      const data = await response.json();
      
      // Remove typing indicator and add bot response
      setMessages(prev => 
        prev.filter(msg => msg.id !== "typing").concat({
          id: `bot-${Date.now()}`,
          type: "bot",
          content: data.response,
          timestamp: new Date(),
        })
      );
      
    } catch (error) {
      console.error("Error processing symptom check:", error);
      
      // Remove typing indicator and add error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== "typing").concat({
          id: `error-${Date.now()}`,
          type: "system",
          content: "Sorry, I couldn't process your symptoms. Please try again or contact a healthcare provider directly if you're experiencing severe symptoms.",
          timestamp: new Date(),
        })
      );
      
      toast({
        title: "Error",
        description: "Failed to analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Enter key press in input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="bg-primary bg-opacity-10 border-b border-neutral-dark">
        <CardTitle className="text-center relative flex items-center justify-center">
          <span className="material-icons mr-2 text-primary">health_and_safety</span>
          AI Symptom Checker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-primary text-white"
                  : message.type === "bot"
                  ? "bg-neutral-dark"
                  : "bg-secondary bg-opacity-10 text-center w-full italic"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="border-t border-neutral-dark p-4">
        <div className="flex items-center w-full gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms..."
            className="flex-grow resize-none"
            maxLength={500}
            rows={2}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            className="h-full"
          >
            <span className="material-icons">send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}