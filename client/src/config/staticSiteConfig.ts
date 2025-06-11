/**
 * Static Site Configuration
 * 
 * This file contains configuration specifically for static site deployments
 * where there is no backend server available.
 */

export const staticSiteConfig = {
  // Whether the application is running in static mode
  isStaticMode: import.meta.env.VITE_STATIC_MODE === 'true',
  
  // Sample user data for demonstration
  sampleUser: {
    id: 1,
    email: 'patient@example.com',
    name: 'Sample Patient',
    role: 'patient',
    phone: '555-123-4567',
    address: '123 Main St, San Francisco, CA 94103',
    createdAt: new Date('2023-01-01')
  },
  
  // Sample doctor data
  sampleDoctor: {
    id: 1,
    userId: 2,
    specialty: 'General Medicine',
    averageRating: 4.8,
    reviewCount: 125,
    isAvailable: true,
    user: {
      id: 2,
      email: 'doctor@example.com',
      name: 'Dr. Jane Smith',
      role: 'doctor',
      phone: '555-987-6543',
      profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
      createdAt: new Date('2022-11-15')
    }
  },
  
  // Static data file paths
  dataFiles: {
    doctors: '/data/doctors.json',
    hospitals: '/data/hospitals-sf.json',
    emergencyTransport: '/data/emergency-transport.json'
  },
  
  // Default coordinates for map display (San Francisco)
  defaultCoordinates: {
    lat: 37.7749,
    lng: -122.4194
  }
};

// Helper function to check if we're in static mode
export const isStaticMode = (): boolean => {
  return (
    import.meta.env.VITE_STATIC_MODE === 'true' || 
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('netlify.app') ||
    window.location.hostname.includes('pages.dev')
  );
};