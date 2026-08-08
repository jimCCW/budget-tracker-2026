import axios from 'axios';
import { signOut } from 'next-auth/react';
import {
  getAccessToken,
  publishAccessToken,
  resolveAccessToken,
} from '@/lib/authToken';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await resolveAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // The backend JWT (7d) can expire while the NextAuth cookie is still
    // valid. Drop the dead token and end the session rather than 401-looping.
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      getAccessToken()
    ) {
      publishAccessToken(null);
      void signOut({ callbackUrl: '/login' });
    }
    return Promise.reject(err.response?.data?.error ?? err);
  }
);
