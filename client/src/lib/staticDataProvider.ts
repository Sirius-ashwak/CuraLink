/**
 * Static Data Provider
 * 
 * This utility helps the application work as a static website
 * by loading data from static JSON files when running in static mode
 * or from the API when running with a backend.
 */

import axios from 'axios';

// Determine if we're running in static mode (no backend)
const isStaticMode = (): boolean => {
  // Check if we're in a production environment without a backend
  // This could be determined by an environment variable, URL, or other means
  return (
    import.meta.env.VITE_STATIC_MODE === 'true' || 
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('netlify.app') ||
    window.location.hostname.includes('static-site')
  );
};

// Function to fetch data from either static JSON files or API
export async function fetchData<T>(
  endpoint: string, 
  params: Record<string, string> = {}
): Promise<T> {
  if (isStaticMode()) {
    // In static mode, load from JSON files in the /data directory
    // Convert API endpoint to a file path
    const filePath = endpoint.replace(/^\/api\//, '/data/') + '.json';
    
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load static data from ${filePath}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading static data from ${filePath}:`, error);
      // Return empty array or object as fallback
      return (Array.isArray({} as T) ? [] : {}) as T;
    }
  } else {
    // In normal mode, use the API
    try {
      const response = await axios.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      // Return empty array or object as fallback
      return (Array.isArray({} as T) ? [] : {}) as T;
    }
  }
}

// Function to simulate posting data in static mode
export async function postData<T>(
  endpoint: string,
  data: any
): Promise<T> {
  if (isStaticMode()) {
    // In static mode, just log the attempt and return mock success
    console.log(`Static mode: Simulated POST to ${endpoint} with data:`, data);
    
    // For demo/static purposes, we'll just return the data that was posted
    // along with a fake ID and timestamp
    return {
      ...data,
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date().toISOString(),
    } as unknown as T;
  } else {
    // In normal mode, use the API
    try {
      const response = await axios.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error posting data to ${endpoint}:`, error);
      throw error;
    }
  }
}

// Helper for checking if we're in static mode
export const staticMode = {
  isEnabled: isStaticMode,
  
  // Add static data URLs for preview purposes
  previewUrls: {
    doctors: '/data/doctors.json',
    hospitals: '/data/hospitals-sf.json',
    emergencyTransport: '/data/emergency-transport.json'
  }
};