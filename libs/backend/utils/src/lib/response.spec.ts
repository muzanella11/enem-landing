import { describe, expect, it } from 'vitest';
import { errorResponse } from './error-response.js';
import { successResponse } from './success-response.js';

describe('successResponse', () => {
  it('wraps data in the shared envelope', () => {
    expect(successResponse(200, 'Success', { id: 1 })).toEqual({
      statusCode: 200,
      message: 'Success',
      data: { id: 1 },
    });
  });
});

describe('errorResponse', () => {
  it('shares statusCode/message with successResponse and adds when/where', () => {
    const body = errorResponse(404, 'Not found', '/blog-posts/x');
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Not found',
      path: '/blog-posts/x',
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('omits path when none is given', () => {
    expect(errorResponse(500, 'boom')).not.toHaveProperty('path');
  });
});
