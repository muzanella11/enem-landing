import type { User } from '@enem-landing/shared-types';
import {
  StaticAccount,
  StaticAccountSystem,
  benchmark,
  createAxiosInstance,
} from '@enem-landing/shared-utils';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AxiosError } from 'axios';
import FormData from 'form-data';
import type { Request } from 'express';
import { accountApiHost } from './sso.constants.js';

interface SuccessEnvelope<T> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Ported from mau-apps (`libs/backend/sso/src/lib/sso.service.ts`), trimmed
 * to the methods that have an actual use case in enem-landing — see the
 * "Koreksi audit method" note in `issues/05-backend-sso-lib.md` for what
 * was excluded (balance/wallet methods) and why `uploadFile`/`deleteFile`
 * were kept (generic proxy to `enem-landing-account-api`'s `/uploads`, needed
 * by `enem-landing-api` for Experience/Project/SiteProfile images).
 */
@Injectable()
export class SsoService {
  private readonly constructorName = this.constructor.name;

  extractToken(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token is required');
    }
    return authHeader.split(' ')[1];
  }

  async login(email: string, password: string) {
    return benchmark(`${this.constructorName}@login`, async () => {
      try {
        const axios = createAxiosInstance({ baseURL: accountApiHost });
        // `createAxiosInstance`'s response interceptor unwraps to `.data`
        // already, so the real runtime shape is the envelope itself, not
        // `AxiosResponse<envelope>` — axios's own types can't know that.
        const response = (await axios.post('/auth/signin', {
          email,
          password,
        })) as unknown as SuccessEnvelope<{ token: string }>;
        if (!response.data?.token) {
          throw new UnauthorizedException('Invalid credentials');
        }
        return response;
      } catch {
        throw new UnauthorizedException('Invalid credentials');
      }
    });
  }

  async loginAsSystem(): Promise<string> {
    return benchmark(`${this.constructorName}@loginAsSystem`, async () => {
      const { email, password } = StaticAccount[StaticAccountSystem];
      const response = await this.login(email, password);
      const token = response.data?.token;
      if (!token) {
        throw new UnauthorizedException('Failed to login as system');
      }
      return token;
    });
  }

  async whoAmI(token: string): Promise<SuccessEnvelope<User>> {
    return benchmark(`${this.constructorName}@whoAmI`, async () => {
      if (!token) {
        throw new UnauthorizedException('Token is required');
      }
      try {
        const axios = createAxiosInstance({ baseURL: accountApiHost, token });
        const response = (await axios.post('/auth/whoami')) as unknown as SuccessEnvelope<User>;
        if (!response.data) {
          throw new UnauthorizedException('Failed connecting to SSO service');
        }
        return response;
      } catch {
        throw new UnauthorizedException('Failed connecting to SSO service');
      }
    });
  }

  async uploadFile(
    token: string,
    file: { buffer: Buffer; filename: string; mimetype: string },
    options: { app: string; purpose: string; maxSize: number; allowedMime: string[] },
  ): Promise<{ id: string; url: string }> {
    return benchmark(`${this.constructorName}@uploadFile`, async () => {
      const form = new FormData();
      form.append('file', file.buffer, { filename: file.filename, contentType: file.mimetype });
      form.append('app', options.app);
      form.append('purpose', options.purpose);
      form.append('maxSize', String(options.maxSize));
      form.append('allowedMime', options.allowedMime.join(','));

      try {
        const axios = createAxiosInstance({ baseURL: accountApiHost, token });
        const response = (await axios.post('/uploads', form, {
          headers: form.getHeaders(),
        })) as unknown as SuccessEnvelope<{ id: string; url: string }>;
        if (!response.data) {
          throw new UnauthorizedException('Failed to upload file');
        }
        return response.data;
      } catch (error) {
        this.throwMapped(error, 'Failed to upload file');
      }
    });
  }

  async deleteFile(token: string, fileId: string): Promise<void> {
    return benchmark(`${this.constructorName}@deleteFile`, async () => {
      try {
        const axios = createAxiosInstance({ baseURL: accountApiHost, token });
        await axios.delete(`/uploads/${fileId}`);
      } catch (error) {
        this.throwMapped(error, 'Failed to delete file');
      }
    });
  }

  private throwMapped(error: unknown, fallbackMessage: string): never {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message ?? fallbackMessage;

    if (status === HttpStatus.BAD_REQUEST) throw new BadRequestException(message);
    if (status === HttpStatus.FORBIDDEN) throw new ForbiddenException(message);
    if (status === HttpStatus.NOT_FOUND) throw new NotFoundException(message);
    throw new UnauthorizedException(message);
  }
}
