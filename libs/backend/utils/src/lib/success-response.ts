export interface SuccessResponseBody<T> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Lean equivalent of mau-apps' `SuccessResponse` class
 * (`libs/backend/utils/src/lib/response/success-response.ts`) — a plain
 * object instead of a class extending `HttpException`, since nothing here
 * throws it. Controllers return this directly; Nest serializes it as JSON.
 */
export const successResponse = <T>(
  statusCode: number,
  message: string,
  data?: T,
): SuccessResponseBody<T> => ({ statusCode, message, data });
