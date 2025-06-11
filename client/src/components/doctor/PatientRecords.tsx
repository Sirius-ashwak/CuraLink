import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AppointmentWithUsers } from "@shared/schema";
import { PrivacyController } from "@/lib/privacyControls";
import { format } from "date-fns";
import { Shield, Eye, Clock, UserCheck } from "lucide-react";

export default function PatientRecords() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get doctor info
  const { data: doctorInfo } = useQuery({
    queryKey: ["/api/doctors"],
    select: (data) => {
      if (user && Array.isArray(data)) {
        return data.find((doctor) => doctor.userId === user.id);
      }
      return null;
    },
    enabled: !!user && user.role === "doctor",
  });
  
  // Get all appointments for this doctor
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments", { doctorId: doctorInfo?.id }],
    enabled: !!doctorInfo,
  });
  
  // Extract unique patients from appointments (from Firebase)
  const patients = Array.isArray(appointments) ? appointments.reduce((acc: any[], appointment: any) => {
    if (!appointment?.patient) return acc;
    
    const existingPatient = acc.find((p) => p.id === appointment.patient.id);
    
    if (!existingPatient) {
      const patientAppointments = appointments.filter((a: any) => a.patientId === appointment.patientId);
      const lastAppointment = patientAppointments.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })[0];
      
      acc.push({
        id: appointment.patient.id,
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        age: appointment.patient.profile?.age || "-",
        gender: appointment.patient.profile?.gender || "-", 
        lastVisit: lastAppointment?.date || "New Patient",
        status: lastAppointment?.status || "New",
        appointmentCount: patientAppointments.length
      });
    }
    
    return acc;
  }, []) : [];
  
  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) => {
    return patient.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const formatLastVisit = (date: string | Date) => {
    if (date === "New Patient") return date;
    return format(new Date(date), "MMM d, yyyy");
  };
  
  if (isLoading || !doctorInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Records</h3>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search patients"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-icons text-text-secondary absolute left-2 top-2">search</span>
          </div>
        </div>
        
        {filteredPatients.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {searchTerm
              ? "No patients found matching your search"
              : "No patient records available"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-dark">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-dark flex-shrink-0 mr-3">
                          <span className="w-full h-full flex items-center justify-center text-xs font-medium text-text-secondary">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-xs text-text-secondary">
                            {patient.age} yrs • {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatLastVisit(patient.lastVisit)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium py-1 px-2 rounded-full 
                          ${
                            patient.status === "completed"
                              ? "bg-secondary bg-opacity-10 text-secondary"
                              : patient.status === "New"
                              ? "bg-primary bg-opacity-10 text-primary"
                              : "bg-neutral-dark bg-opacity-20 text-text-secondary"
                          }`}
                      >
                        {patient.status === "completed" ? "Follow-up" : patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-primary hover:text-primary-dark mr-2">
                        View Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
