import axios, { AxiosInstance } from 'axios';

export interface CreateAxiosInstanceConfig {
  baseURL?: string;
  token?: string;
  customHeaders?: Record<string, string>;
  /**
   * Resolve with the API's `data` instead of the whole
   * `{ statusCode, message, data }` envelope (`successResponse` in
   * `@enem-landing/backend-utils`). For BFF clients that pass enem-landing-api
   * payloads straight through to their own pages.
   */
  unwrapEnvelope?: boolean;
}

interface ResponseEnvelope {
  statusCode: number;
  message: string;
  data?: unknown;
}

const isResponseEnvelope = (body: unknown): body is ResponseEnvelope =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as ResponseEnvelope).statusCode === 'number' &&
  typeof (body as ResponseEnvelope).message === 'string';

/**
 * Ported from mau-apps (`libs/shared/utils/src/lib/axios.ts`) — a thin
 * axios factory used by service-to-service calls (e.g. `SsoService` in
 * Story 05) that unwraps `response.data` automatically and attaches a
 * Bearer token when provided.
 */
export const createAxiosInstance = (
  config: CreateAxiosInstanceConfig,
): AxiosInstance => {
  const { baseURL, token, customHeaders, unwrapEnvelope } = config;

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
    (response) =>
      unwrapEnvelope && isResponseEnvelope(response.data)
        ? response.data.data
        : response.data,
    (error) => Promise.reject(error),
  );

  return instance;
};
