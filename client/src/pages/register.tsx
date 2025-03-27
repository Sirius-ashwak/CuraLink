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
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <span className="material-icons text-white text-2xl">health_and_safety</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">AI Health Bridge</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <Tabs defaultValue="patient" onValueChange={(value) => setRole(value as "patient" | "doctor")}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="doctor">Healthcare Provider</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
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
                
                <TabsContent value="patient">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="profile.age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="35" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                          <FormLabel>Gender (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
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
                        <FormLabel>Specialty</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General Physician">General Physician</SelectItem>
                            <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                            <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                            <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                            <SelectItem value="Mental Health Specialist">Mental Health Specialist</SelectItem>
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
                        <FormLabel>Professional Bio (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of your qualifications and experience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </Tabs>
          
          <div className="mt-6 pt-4 border-t border-neutral-dark text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <a href="/" className="text-primary hover:text-primary-dark font-medium">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
