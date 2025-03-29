import { Link, useLocation } from "wouter";

export default function PatientNavigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path ? "text-blue-500" : "text-gray-400";
  };
  
  return (
    <nav className="md:hidden bg-black shadow-md border-t border-gray-800 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/dashboard">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard")}`}>
            <span className="material-icons">home</span>
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/dashboard#book-appointment">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard#book-appointment")}`}>
            <span className="material-icons">calendar_month</span>
            <span className="text-xs mt-1">Book</span>
          </a>
        </Link>
        <Link href="/dashboard#upcoming-appointments">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard#upcoming-appointments")}`}>
            <span className="material-icons">event</span>
            <span className="text-xs mt-1">Appointments</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/profile")}`}>
            <span className="material-icons">account_circle</span>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
