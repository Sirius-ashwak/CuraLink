import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Heart, Stethoscope } from "lucide-react";
import { registerWithFirebase } from "@/lib/firebaseAuth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  specialty: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      specialty: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Create user with Firebase Authentication
      const firebaseUser = await registerWithFirebase({
        ...data,
        role,
      });

      // Store additional user data in Firestore
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role,
        specialty: role === "doctor" ? data.specialty : null,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore using Firebase UID as document ID
      if (role === "patient") {
        await setDoc(doc(db, "patients", firebaseUser.uid), userData);
      } else {
        await setDoc(doc(db, "doctors", firebaseUser.uid), {
          ...userData,
          isAvailable: true,
          rating: 0,
          reviews: 0,
        });
      }

      toast({
        title: "Account created successfully!",
        description: `Welcome to AI Health Bridge, ${data.firstName}!`,
      });

      // Redirect to dashboard
      setLocation(role === "patient" ? "/dashboard" : "/doctor-dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold text-white">AI Health Bridge</h1>
          </div>
          <p className="text-gray-300 text-lg">Create your account</p>
        </div>
        
        <Tabs value={role} onValueChange={(value) => setRole(value as "patient" | "doctor")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="patient" className="text-white data-[state=active]:bg-blue-600">
              <Heart className="h-4 w-4 mr-2" />
              Patient
            </TabsTrigger>
            <TabsTrigger value="doctor" className="text-white data-[state=active]:bg-blue-600">
              <Stethoscope className="h-4 w-4 mr-2" />
              Healthcare Provider
            </TabsTrigger>
          </TabsList>

          <TabsContent value={role}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                          />
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
                        <FormLabel className="text-gray-300">Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                          />
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
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
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
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "doctor" && (
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Medical Specialty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="General Practice">General Practice</SelectItem>
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Dermatology">Dermatology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                            <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="Emergency Medicine">Emergency Medicine</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="bg-slate-700 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-300">
                    {role === "patient" 
                      ? "Patient account ready! You can add more profile details after registration."
                      : "Doctor account ready! You can set your availability and profile after registration."
                    }
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Already have an account? <a href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}