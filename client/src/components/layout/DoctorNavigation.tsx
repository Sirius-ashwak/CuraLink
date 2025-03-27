import { Link, useLocation } from "wouter";

export default function DoctorNavigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path ? "text-primary" : "text-text-secondary";
  };
  
  return (
    <nav className="md:hidden bg-white shadow-md border-t border-neutral-dark fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/dashboard">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard")}`}>
            <span className="material-icons">today</span>
            <span className="text-xs mt-1">Schedule</span>
          </a>
        </Link>
        <Link href="/dashboard?tab=availability">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard?tab=availability")}`}>
            <span className="material-icons">event_available</span>
            <span className="text-xs mt-1">Availability</span>
          </a>
        </Link>
        <Link href="/dashboard?tab=patients">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard?tab=patients")}`}>
            <span className="material-icons">person</span>
            <span className="text-xs mt-1">Patients</span>
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
