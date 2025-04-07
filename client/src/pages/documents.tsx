import MainLayout from "@/components/layout/MainLayout";
import HealthDocumentManager from "@/components/documents/HealthDocumentManager";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Documents() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Health Documents</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <HealthDocumentManager />
        </div>
      </div>
    </MainLayout>
  );
}