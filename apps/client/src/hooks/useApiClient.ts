/**
 * API Client Hook
 *
 * Provides a configured Axios instance for making HTTP requests.
 *
 * Features:
 * - Base URL from environment
 * - Default headers (Content-Type, Auth if available)
 * - Request/response interceptors
 * - Error handling
 */

import axios from 'axios';

/**
 * Create and return a configured Axios instance
 * This hook can be called from any component
 */
export function useApiClient() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const apiClient = axios.create({
    baseURL: apiUrl,
    timeout: 10000, // 10 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request Interceptor
   * Add auth token, logging, etc. before sending requests
   */
  apiClient.interceptors.request.use(
    (config) => {
      // Add auth token if available
      // const token = localStorage.getItem('auth_token');
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }

      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('[API] Request failed', error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handle responses, errors, token refresh, etc.
   */
  apiClient.interceptors.response.use(
    (response) => {
      console.debug(`[API] Response ${response.status} from ${response.config.url}`);
      return response;
    },
    (error) => {
      if (error.response) {
        // Server responded with error status
        console.error(`[API] Error ${error.response.status}:`, error.response.data);

        // Handle 401 (Unauthorized) - could redirect to login
        if (error.response.status === 401) {
          // window.location.href = '/login';
        }

        // Handle 403 (Forbidden)
        if (error.response.status === 403) {
          console.error('[API] Access forbidden');
        }
      } else if (error.request) {
        // Request made but no response
        console.error('[API] No response received:', error.request);
      } else {
        // Error in request setup
        console.error('[API] Error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
}
