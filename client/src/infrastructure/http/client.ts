import axios, { isAxiosError } from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let unauthorizedHandler: (() => void) | undefined;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}

let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const { data } = await axios.get<{ token: string }>(
    `${import.meta.env.VITE_API_URL ?? ''}/csrf`,
    { withCredentials: true },
  );
  csrfToken = data.token;
  return csrfToken;
}

export function forgetCsrfToken() {
  csrfToken = null;
}

const UNSAFE = new Set(['post', 'put', 'patch', 'delete']);

http.interceptors.request.use(async (config) => {
  if (!UNSAFE.has((config.method ?? 'get').toLowerCase())) return config;
  config.headers.set('X-CSRF-Token', csrfToken ?? (await fetchCsrfToken()));
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) return Promise.reject(error);
    if (error.response?.status === 401) notifyUnauthorized();

    const config = error.config as (typeof error.config & { csrfRetried?: boolean }) | undefined;
    const staleToken =
      error.response?.status === 403 && !!csrfToken && config && !config.csrfRetried;
    if (staleToken) {
      config.csrfRetried = true;
      forgetCsrfToken();
      return http.request(config);
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue') {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  if (error instanceof Error && error.name === 'StreamError') return error.message;
  return fallback;
}

export function apiUrl(path: string) {
  return `${import.meta.env.VITE_API_URL ?? ''}${path}`;
}
