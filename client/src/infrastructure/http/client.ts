import axios, { isAxiosError } from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let unauthorizedHandler: (() => void) | undefined;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) unauthorizedHandler?.();
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue') {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return fallback;
}
