import axios, { AxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';

// Base URL for API requests
const BASE_URL = '';

// Default headers
const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Make API request with proper typing
 */
export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem('authToken');
    
    // Add authorization header if token exists
    const headers = {
      ...defaultHeaders,
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    
    // Make request
    const response = await axios({
      ...config,
      url: `${BASE_URL}${config.url}`,
      headers,
    });
    
    return response.data as T;
  } catch (error) {
    // Extract error message
    let message = 'Unknown error occurred';
    if (axios.isAxiosError(error)) {
      message = error.response?.data?.error || error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    console.error(`API request failed: ${message}`, error);
    throw new Error(message);
  }
};

/**
 * Create query client configuration
 * This is used by TanStack Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});