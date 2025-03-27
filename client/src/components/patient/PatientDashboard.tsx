import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import AppointmentCard from "./AppointmentCard";
import AppointmentBooking from "./AppointmentBooking";
import OfflineIndicator from "../notifications/OfflineIndicator";
import NotificationToast from "../notifications/NotificationToast";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { appointments, isLoading } = useAppointments();
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ title: "", message: "" });
  
  useEffect(() => {
    // This would come from WebSocket notifications in a real application
    const hasAppointmentsToday = appointments.some(appointment => {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      return (
        appointmentDate.getDate() === today.getDate() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getFullYear() === today.getFullYear()
      );
    });
    
    if (hasAppointmentsToday && !showNotification) {
      setNotification({
        title: "Upcoming Appointment Today",
        message: "You have an appointment scheduled for today. Please be available at the scheduled time."
      });
      setShowNotification(true);
    }
  }, [appointments, showNotification]);
  
  if (!user) return null;
  
  return (
    <>
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-xl font-medium text-text-primary">Welcome back, {user.firstName}</h2>
        <p className="text-text-secondary">How can we help you today?</p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <a href="#book-appointment" className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-2">
            <span className="material-icons text-white">calendar_month</span>
          </div>
          <span className="text-sm font-medium text-center">Book Appointment</span>
        </a>
        <a href="#upcoming-appointments" className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-2">
            <span className="material-icons text-white">event</span>
          </div>
          <span className="text-sm font-medium text-center">My Appointments</span>
        </a>
        <a href="#" className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center mb-2">
            <span className="material-icons text-white">videocam</span>
          </div>
          <span className="text-sm font-medium text-center">Join Consultation</span>
        </a>
        <a href="#" className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-neutral-dark flex items-center justify-center mb-2">
            <span className="material-icons text-white">history</span>
          </div>
          <span className="text-sm font-medium text-center">Medical History</span>
        </a>
      </div>
      
      {/* Upcoming Appointments */}
      <section id="upcoming-appointments" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Upcoming Appointments</h3>
          <a href="#" className="text-primary text-sm">View all</a>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-text-secondary">You don't have any upcoming appointments.</p>
            <a href="#book-appointment" className="text-primary font-medium mt-2 inline-block">
              Book your first appointment
            </a>
          </div>
        )}
      </section>
      
      {/* Book Appointment Section */}
      <AppointmentBooking />
      
      {/* Notifications */}
      <OfflineIndicator />
      {showNotification && (
        <NotificationToast 
          title={notification.title}
          message={notification.message}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
}
