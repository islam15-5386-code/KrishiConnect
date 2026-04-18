import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api';

export const apiClient = axios.create({
  baseURL:        API_BASE_URL,
  timeout:        15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    'X-App-Client': 'krishiconnect-mobile',
  },
});

// ─── Request Interceptor: Inject Sanctum Token ────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth?.token;

    if (token) {
      // Check if token has expired (client-side guard)
      const expiresAt = state.auth?.expiresAt;
      if (expiresAt && Date.now() > expiresAt) {
        store.dispatch(logout());
        return Promise.reject(new Error('Token expired. Please login again.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 Globally ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired on server — force logout
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// ─── Multipart helper for ticket/listing image uploads ───────────────────
export const uploadWithImages = async (
  endpoint: string,
  fields: Record<string, string>,
  imageUris: string[]
) => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  imageUris.forEach((uri, index) => {
    const ext      = uri.split('.').pop() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('images', {
      uri,
      name:  `image_${index}.${ext}`,
      type:  mimeType,
    } as any);
  });

  return apiClient.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
