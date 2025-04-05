import { Link, useLocation } from "wouter";

export default function PatientNavigation() {
  const [location, setLocation] = useLocation();
  
  const isActive = (path: string) => {
    return location === path || (location.startsWith(path) && path !== "/") 
      ? "text-blue-500" 
      : "text-gray-500 dark:text-gray-400";
  };

  // Send custom event for tab changes that the Dashboard component will listen for
  const handleTabChange = (tabName: string) => {
    const tabChangeEvent = new CustomEvent('tabChange', { 
      detail: { tabName }
    });
    window.dispatchEvent(tabChangeEvent);
  };
  
  return (
    <nav className="md:hidden bg-white dark:bg-black shadow-md border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <a 
          onClick={() => {
            setLocation("/dashboard");
            handleTabChange("dashboard");
          }}
          className={`flex flex-col items-center py-2 px-3 ${isActive("/dashboard")} cursor-pointer`}
        >
          <span className="material-icons">home</span>
          <span className="text-xs mt-1">Home</span>
        </a>
        
        <a 
          onClick={() => {
            setLocation("/dashboard");
            handleTabChange("appointments");
          }}
          className={`flex flex-col items-center py-2 px-3 cursor-pointer ${
            location === "/dashboard" && location.includes("appointments") ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className="material-icons">calendar_month</span>
          <span className="text-xs mt-1">Book</span>
        </a>
        
        <a 
          onClick={() => {
            setLocation("/dashboard"); 
            setTimeout(() => {
              const element = document.getElementById("upcoming-appointments");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          }}
          className={`flex flex-col items-center py-2 px-3 cursor-pointer ${
            location === "/dashboard" && location.includes("upcoming-appointments") ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className="material-icons">event</span>
          <span className="text-xs mt-1">Appointments</span>
        </a>
        
        <a 
          onClick={() => {
            setLocation("/profile");
          }}
          className={`flex flex-col items-center py-2 px-3 cursor-pointer ${isActive("/profile")}`}
        >
          <span className="material-icons">account_circle</span>
          <span className="text-xs mt-1">Profile</span>
        </a>
      </div>
    </nav>
  );
}
