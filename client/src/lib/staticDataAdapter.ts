/**
 * Static Data Adapter
 * 
 * This provides mock data for the static site version of the application.
 * It simulates API responses without requiring a backend server.
 */

import { isStaticMode } from "@/config/staticSiteConfig";

// Collection of sample data for static site mode
export const staticData = {
  // Sample doctors list
  doctors: [
    {
      id: 1,
      userId: 2,
      specialty: "General Medicine",
      averageRating: 4.8,
      reviewCount: 125,
      isAvailable: true,
      user: {
        id: 2,
        email: "doctor@example.com",
        name: "Dr. Jane Smith",
        role: "doctor",
        phone: "555-987-6543",
        profileImage: "https://randomuser.me/api/portraits/women/65.jpg"
      }
    },
    {
      id: 2,
      userId: 3,
      specialty: "Cardiology",
      averageRating: 4.9,
      reviewCount: 210,
      isAvailable: true,
      user: {
        id: 3,
        email: "cardiologist@example.com",
        name: "Dr. Michael Chen",
        role: "doctor",
        phone: "555-123-7890",
        profileImage: "https://randomuser.me/api/portraits/men/32.jpg"
      }
    },
    {
      id: 3,
      userId: 4,
      specialty: "Pediatrics",
      averageRating: 4.7,
      reviewCount: 98,
      isAvailable: false,
      user: {
        id: 4,
        email: "pediatrician@example.com",
        name: "Dr. Sarah Johnson",
        role: "doctor",
        phone: "555-456-7890",
        profileImage: "https://randomuser.me/api/portraits/women/45.jpg"
      }
    }
  ],
  
  // Sample nearby hospitals
  nearbyHospitals: [
    {
      name: "General Hospital",
      address: "123 Main St, San Francisco, CA 94103",
      distance: "1.2km"
    },
    {
      name: "Children's Medical Center",
      address: "456 Park Ave, San Francisco, CA 94107",
      distance: "2.5km"
    },
    {
      name: "City Medical Center",
      address: "789 Market St, San Francisco, CA 94103",
      distance: "3.1km"
    },
    {
      name: "Community Hospital",
      address: "321 Oak St, San Francisco, CA 94102",
      distance: "4.3km"
    }
  ],
  
  // Sample emergency transport requests
  emergencyTransport: [
    {
      id: 1,
      patientId: 1,
      requestDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      pickupLocation: "123 Rural Road, San Francisco, CA 94103",
      pickupCoordinates: "37.7749,-122.4194",
      destination: "General Hospital",
      reason: "Severe chest pain",
      urgency: "high",
      status: "in_progress",
      vehicleType: "ambulance",
      driverName: "John Driver",
      driverPhone: "555-789-1234",
      estimatedArrival: new Date(Date.now() + 1200000).toISOString(), // 20 minutes from now
      patient: {
        id: 1,
        name: "Sample Patient",
        email: "patient@example.com",
        phone: "555-123-4567"
      }
    }
  ],
  
  // Sample appointments
  appointments: [
    {
      id: 1,
      patientId: 1,
      doctorId: 1,
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      startTime: "10:00",
      endTime: "10:30",
      status: "confirmed",
      type: "video",
      reason: "General Consultation",
      notes: "",
      callUrl: "",
      patient: {
        id: 1,
        name: "Sample Patient",
        email: "patient@example.com"
      },
      doctor: {
        id: 1,
        userId: 2,
        specialty: "General Medicine",
        averageRating: 4.8,
        reviewCount: 125,
        isAvailable: true,
        user: {
          id: 2,
          name: "Dr. Jane Smith",
          email: "doctor@example.com"
        }
      }
    }
  ]
};

/**
 * Generic function to fetch static data or API data based on mode
 */
export async function fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // In static mode, return mock data
  if (isStaticMode()) {
    console.log(`[Static Mode] Fetching data for: ${endpoint}`);
    
    // Map API endpoints to static data
    switch (endpoint) {
      case '/api/doctors':
        return staticData.doctors as unknown as T;
      
      case '/api/maps/nearby-hospitals':
        return staticData.nearbyHospitals as unknown as T;
      
      case '/api/emergency-transport':
        return staticData.emergencyTransport as unknown as T;
      
      case '/api/appointments':
        return staticData.appointments as unknown as T;
      
      default:
        console.warn(`[Static Mode] No mock data found for endpoint: ${endpoint}`);
        return [] as unknown as T;
    }
  }
  
  // In API mode, fetch from actual API
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Function to simulate posting data in static mode or actually post in API mode
 */
export async function postData<T>(endpoint: string, data: any): Promise<T> {
  // In static mode, just log and return mock response
  if (isStaticMode()) {
    console.log(`[Static Mode] POST to ${endpoint} with data:`, data);
    
    // Generate mock ID for created resources
    const mockId = Math.floor(Math.random() * 10000);
    
    // Return appropriate mock response based on endpoint
    switch (endpoint) {
      case '/api/emergency-transport':
        return {
          id: mockId,
          ...data,
          status: 'requested',
          requestDate: new Date().toISOString(),
          patient: {
            id: 1,
            name: "Sample Patient",
            email: "patient@example.com"
          }
        } as unknown as T;
      
      default:
        return {
          id: mockId,
          ...data,
          createdAt: new Date().toISOString()
        } as unknown as T;
    }
  }
  
  // In API mode, post to actual API
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error posting to ${endpoint}`);
  }
  
  return await response.json();
}