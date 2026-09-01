import axios, { AxiosInstance } from 'axios';

export interface CreateAxiosInstanceConfig {
  baseURL?: string;
  token?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Ported from mau-apps (`libs/shared/utils/src/lib/axios.ts`) — a thin
 * axios factory used by service-to-service calls (e.g. `SsoService` in
 * Story 05) that unwraps `response.data` automatically and attaches a
 * Bearer token when provided.
 */
export const createAxiosInstance = (
  config: CreateAxiosInstanceConfig,
): AxiosInstance => {
  const { baseURL, token, customHeaders } = config;

  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  });

  instance.interceptors.request.use((requestConfig) => {
    if (token) {
      requestConfig.headers.set('Authorization', `Bearer ${token}`);
    }
    return requestConfig;
  });

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error),
  );

  return instance;
};
