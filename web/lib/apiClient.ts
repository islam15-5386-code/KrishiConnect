import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Client': 'krishiconnect-web',
  },
});

// Optionally add a request interceptor for tokens if using client-side auth for the web dashboard
apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = (session as any)?.sanctumToken as string | undefined;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    return Promise.reject(error);
  }
);
