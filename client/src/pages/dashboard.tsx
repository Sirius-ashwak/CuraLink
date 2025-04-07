import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import PatientDashboard from "@/components/patient/PatientDashboard";
import DoctorDashboard from "@/components/doctor/DoctorDashboard";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Debug to help track any issues
  useEffect(() => {
    console.log("Dashboard component rendered with user:", user?.email);
  }, [user]);

  // Determine which dashboard to render based on user role
  let DashboardComponent;
  if (user?.role === "patient") {
    DashboardComponent = PatientDashboard;
  } else if (user?.role === "doctor") {
    DashboardComponent = DoctorDashboard;
  } else {
    console.error("Unknown user role:", user?.role);
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
  
  // Just render the dashboard component - authentication is handled by ProtectedRoute
  return <DashboardComponent />;
}
