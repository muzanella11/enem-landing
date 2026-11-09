export interface ErrorResponseBody {
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
}

/**
 * Error counterpart of `successResponse`: every failed request answers with
 * the same `{ statusCode, message }` pair a success has, plus when and where
 * it failed. `AllExceptionsFilter` builds every error body with this, so
 * controllers just throw Nest's HTTP exceptions.
 */
export const errorResponse = (
  statusCode: number,
  message: string,
  path?: string,
): ErrorResponseBody => ({
  statusCode,
  message,
  timestamp: new Date().toISOString(),
  ...(path === undefined ? {} : { path }),
});
