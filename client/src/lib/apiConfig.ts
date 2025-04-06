// API configuration for different environments

// Get the base API URL based on the environment
export const getApiBaseUrl = (): string => {
  // For static site deployment, use the environment variable
  if (import.meta.env.VITE_STATIC_DEPLOYMENT === "true") {
    return import.meta.env.VITE_API_URL || "";
  }
  
  // For development or regular deployment
  const protocol = window.location.protocol;
  const host = import.meta.env.DEV 
    ? `${window.location.hostname}:5000` 
    : window.location.host;
    
  return `${protocol}//${host}`;
};

// Create a configured fetch function that uses the correct API URL
export const apiFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for authentication
  });
};

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    } catch (e) {
      throw new Error(`API error: ${response.status}`);
    }
  }
  
  return response.json() as Promise<T>;
};