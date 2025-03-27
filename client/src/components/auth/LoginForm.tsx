import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
      const response = await apiRequest("POST", "/api/auth/login", {
        ...data,
        role,
      });
      
      const userData = await response.json();
      setUser(userData);
      setLocation("/dashboard");
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName}!`,
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <span className="material-icons text-white text-2xl">health_and_safety</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">AI Health Bridge</h1>
        <p className="text-muted-foreground mt-2">Connecting communities to healthcare</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <Tabs defaultValue="patient" onValueChange={(value) => setRole(value as "patient" | "doctor")}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="doctor">Healthcare Provider</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patient">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="doctor">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-primary hover:text-primary-dark">Forgot password?</a>
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-dark text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <a href="/register" className="text-primary hover:text-primary-dark font-medium">Sign up</a>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Need immediate medical attention? Please call emergency services.</p>
      </div>
    </div>
  );
}
