import { DoctorWithUserInfo } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorSelectionProps {
  doctors: DoctorWithUserInfo[];
  isLoading: boolean;
  selectedDoctor: DoctorWithUserInfo | null;
  onSelect: (doctor: DoctorWithUserInfo) => void;
}

export default function DoctorSelection({ 
  doctors, 
  isLoading, 
  selectedDoctor, 
  onSelect 
}: DoctorSelectionProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">Available Doctors</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  if (doctors.length === 0) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">Available Doctors</label>
        <div className="p-4 border border-neutral-dark rounded-lg text-center">
          <p className="text-text-secondary">No doctors available for this specialty</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text-secondary mb-2">Available Doctors</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id}
            className={`border rounded-lg p-3 cursor-pointer ${
              selectedDoctor?.id === doctor.id 
                ? "border-primary" 
                : "border-neutral-dark hover:border-primary"
            }`}
            onClick={() => onSelect(doctor)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-neutral-dark mr-3 flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {doctor.user.firstName.charAt(0)}{doctor.user.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-medium">Dr. {doctor.user.firstName} {doctor.user.lastName}</h4>
                <p className="text-text-secondary text-sm">{doctor.specialty}</p>
                <div className="flex items-center mt-1">
                  <span className="material-icons text-accent text-sm">star</span>
                  <span className="text-xs ml-1">
                    {(doctor.averageRating / 10).toFixed(1)} ({doctor.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
