import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import PatientDashboard from "@/components/patient/PatientDashboard";
import DoctorDashboard from "@/components/doctor/DoctorDashboard";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Debug to help track any issues
  useEffect(() => {
    if (!isLoading) {
      console.log("Dashboard component loaded with user:", user);
    }
  }, [user, isLoading]);

  // Show an enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-950">
        <div className="space-y-6 w-full max-w-md px-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <svg className="animate-pulse w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-1">AI Health Bridge</h3>
            <p className="text-blue-400">Loading your dashboard...</p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto bg-gray-800/50" />
            <Skeleton className="h-8 w-1/2 mx-auto bg-gray-800/50" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-lg bg-gray-800/50" />
              <Skeleton className="h-32 rounded-lg bg-gray-800/50" />
            </div>
            <Skeleton className="h-64 rounded-lg bg-gray-800/50" />
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if no user is found
  if (!user) {
    console.log("No user found, redirecting to login");
    // Use a more immediate redirection to avoid page not found
    window.location.href = "/login";
    return null;
  }
  
  // Determine which dashboard to render based on user role
  let DashboardComponent;
  if (user.role === "patient") {
    DashboardComponent = PatientDashboard;
  } else if (user.role === "doctor") {
    DashboardComponent = DoctorDashboard;
  } else {
    console.error("Unknown user role:", user.role);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-950">
        <div className="text-center p-6 bg-gray-900 rounded-lg border border-gray-800 shadow-lg max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Unknown User Role</h2>
          <p className="text-gray-300 mb-4">Your account type could not be determined. Please contact support.</p>
          <button 
            onClick={() => setLocation("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Render the appropriate dashboard within the layout
  return (
    <MainLayout>
      <DashboardComponent />
    </MainLayout>
  );
}
