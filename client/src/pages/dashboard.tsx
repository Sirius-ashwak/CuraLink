import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import PatientDashboard from "@/components/patient/PatientDashboard";
import DoctorDashboard from "@/components/doctor/DoctorDashboard";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    setLocation("/");
    return null;
  }
  
  return (
    <MainLayout>
      {user.role === "patient" ? <PatientDashboard /> : <DoctorDashboard />}
    </MainLayout>
  );
}
