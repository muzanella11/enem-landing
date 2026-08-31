import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

const buildHost = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const response = { status };
  const request = { method: 'POST', url: '/probe' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
};

describe('AllExceptionsFilter', () => {
  it('maps an HttpException to its status and message', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = buildHost();

    filter.catch(new BadRequestException('bad input'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, path: '/probe', message: 'bad input' }),
    );
  });

  it('defaults unknown errors to a 500', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = buildHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500, message: 'boom' }));
  });

  it('rewrites Postgres unique-violation errors into a readable message', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = buildHost();

    const error = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "UQ_email"',
      ),
      { driverError: { detail: 'Key (email)=(admin@example.com) already exists.' } },
    );

    filter.catch(error, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Duplicate key error: email: admin@example.com already exists.',
      }),
    );
  });
});
