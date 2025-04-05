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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  role: z.enum(["patient", "doctor"]),
  specialty: z.string().optional(),
  profile: z.object({
    age: z.number().optional(),
    gender: z.string().optional(),
    bio: z.string().optional(),
  }).optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "patient",
      profile: {
        age: undefined,
        gender: "",
        bio: "",
      },
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    // Update the role based on the selected tab
    data.role = role;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      
      const userData = await response.json();
      setUser(userData);
      setLocation("/dashboard");
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.firstName}!`,
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 mb-4">
            <span className="material-icons text-white text-2xl">health_and_safety</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Health Bridge</h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
          <Tabs defaultValue="patient" onValueChange={(value) => setRole(value as "patient" | "doctor")}>
            <TabsList className="grid grid-cols-2 mb-6 p-1 bg-gray-800 rounded-lg">
              <TabsTrigger value="patient" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">Patient</TabsTrigger>
              <TabsTrigger value="doctor" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">Healthcare Provider</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-300">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-300">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
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
                        <Input type="password" placeholder="••••••••" {...field} className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <TabsContent value="patient">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="profile.age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-300">Age (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="35" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="profile.gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-300">Gender (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="male" className="text-white hover:bg-gray-700">Male</SelectItem>
                              <SelectItem value="female" className="text-white hover:bg-gray-700">Female</SelectItem>
                              <SelectItem value="other" className="text-white hover:bg-gray-700">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say" className="text-white hover:bg-gray-700">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="doctor">
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-300">Specialty</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="General Physician" className="text-white hover:bg-gray-700">General Physician</SelectItem>
                            <SelectItem value="Pediatrician" className="text-white hover:bg-gray-700">Pediatrician</SelectItem>
                            <SelectItem value="Cardiologist" className="text-white hover:bg-gray-700">Cardiologist</SelectItem>
                            <SelectItem value="Dermatologist" className="text-white hover:bg-gray-700">Dermatologist</SelectItem>
                            <SelectItem value="Mental Health Specialist" className="text-white hover:bg-gray-700">Mental Health Specialist</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="profile.bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-300">Professional Bio (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of your qualifications and experience"
                            {...field}
                            className="rounded-md h-11 bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </Tabs>
          
          <div className="mt-6 pt-4 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              Already have an account? <a href="/" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
