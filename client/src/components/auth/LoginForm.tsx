import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Stethoscope } from "lucide-react";
import { registerWithFirebase, signInWithFirebase } from "@/lib/firebaseAuth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Use Firebase Authentication directly
      const firebaseUser = await signInWithFirebase(data.email, data.password);
      
      // Make API call to get user profile
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }
      
      const result = await response.json();
      
      // Store the JWT token in localStorage
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      
      setUser(result.user);
      setLocation("/dashboard");
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${result.user.firstName}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 shadow-md mb-4">
          <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-white">Curalink</h1>
        <p className="text-gray-400 mt-3 text-base">Connecting communities to healthcare</p>
      </div>
      
      <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <Tabs defaultValue="patient" onValueChange={(value) => setRole(value as "patient" | "doctor")}>
          <TabsList className="grid grid-cols-2 mb-6 p-1 bg-gray-800 rounded-lg">
            <TabsTrigger value="patient" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">Patient</TabsTrigger>
            <TabsTrigger value="doctor" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">Healthcare Provider</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patient">
            <div className="flex flex-col items-center mb-5 p-3 rounded-lg bg-gray-800 border border-gray-700">
              <Heart className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-sm text-center text-gray-300">Patients can schedule appointments, consult with doctors, and access our AI symptom checker.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          {...field}
                          className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="doctor">
            <div className="flex flex-col items-center mb-5 p-3 rounded-lg bg-gray-800 border border-gray-700">
              <Stethoscope className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-sm text-center text-gray-300">Healthcare providers have access to additional features including appointment management and patient records.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          {...field} 
                          className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-5 text-center">
          <a href="#" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</a>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account? <a href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">Sign up</a>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-block px-4 py-2 rounded-lg bg-red-900/40 border border-red-800">
          <p className="text-sm text-red-400 font-medium">
            Need immediate medical attention? Please call emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}