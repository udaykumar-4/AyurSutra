import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import Config from '../constants/Config';
import { getItem, deleteItem } from '../utils/secureStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token if available
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getItem(Config.secureStoreKeys.userToken);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Uniform error formatting & 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // Server responded with non-2xx status
      const status = error.response.status;
      const data = error.response.data;

      if (data && data.message) {
        errorMessage = data.message;
      } else if (status === 401) {
        errorMessage = 'Session expired or unauthorized. Please login again.';
        // Clear stored token on 401
        await deleteItem(Config.secureStoreKeys.userToken);
        await deleteItem(Config.secureStoreKeys.userData);
      } else if (status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorMessage = 'Requested resource not found.';
      } else if (status === 409) {
        errorMessage = data.message || 'Conflict: This slot or resource is already booked.';
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // Request sent but no response received (Network error)
      errorMessage = 'Network Error: Cannot connect to server. Please check your connection or backend URL.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
