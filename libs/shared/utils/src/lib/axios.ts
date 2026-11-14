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
  /**
   * The visitor's IP, sent as `X-Forwarded-For` so the backend's per-IP rate
   * limit and tracking count the real visitor instead of the BFF container.
   */
  forwardedFor?: string | null;
  /**
   * Called with the backend's `Retry-After` header when a request fails
   * with it (429), so a BFF can pass it on to the browser.
   */
  onRetryAfter?: (retryAfter: string) => void;
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
  const {
    baseURL,
    token,
    customHeaders,
    unwrapEnvelope,
    forwardedFor,
    onRetryAfter,
  } = config;

  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      'Content-Type': 'application/json',
      ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
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
    (error) => {
      const retryAfter = (
        error as { response?: { headers?: Record<string, unknown> } }
      )?.response?.headers?.['retry-after'];
      if (onRetryAfter && retryAfter !== undefined && retryAfter !== null) {
        onRetryAfter(String(retryAfter));
      }
      return Promise.reject(error);
    },
  );

  return instance;
};
