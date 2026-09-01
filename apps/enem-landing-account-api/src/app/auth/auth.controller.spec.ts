import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './guard/jwt-auth.guard.js';
import { LocalAuthGuard } from './guard/local-auth.guard.js';
import { UserEntity } from '../users/user.entity.js';
import type { AuthJwtPayload } from './auth-jwt-payload.js';

describe('AuthController', () => {
  let service: {
    signup: ReturnType<typeof vi.fn>;
    signin: ReturnType<typeof vi.fn>;
    whoami: ReturnType<typeof vi.fn>;
    signout: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
  };
  let controller: AuthController;

  beforeEach(() => {
    service = {
      signup: vi.fn(),
      signin: vi.fn(),
      whoami: vi.fn(),
      signout: vi.fn(),
      changePassword: vi.fn(),
    };
    controller = new AuthController(service as never);
  });

  it('signup delegates to AuthService.signup', () => {
    const dto = {
      fullname: 'A',
      email: 'a@example.com',
      password: 'password123',
    };
    controller.signup(dto);
    expect(service.signup).toHaveBeenCalledWith(dto);
  });

  it('signin passes req.user (populated by LocalAuthGuard) to AuthService.signin', () => {
    const user = { id: 'user-1' } as UserEntity;
    controller.signin({ user } as never);
    expect(service.signin).toHaveBeenCalledWith(user);
  });

  it('whoami passes req.user (populated by JwtAuthGuard) to AuthService.whoami', () => {
    const payload = { id: 'user-1' } as AuthJwtPayload;
    controller.whoami({ user: payload } as never);
    expect(service.whoami).toHaveBeenCalledWith(payload);
  });

  it('signout passes the authenticated user id to AuthService.signout', () => {
    const payload = { id: 'user-1' } as AuthJwtPayload;
    controller.signout({ user: payload } as never);
    expect(service.signout).toHaveBeenCalledWith('user-1');
  });

  it('changePassword passes the authenticated user id and dto to AuthService.changePassword', () => {
    const payload = { id: 'user-1' } as AuthJwtPayload;
    const dto = {
      currentPassword: 'a',
      newPassword: 'b',
      confirmPassword: 'b',
    };
    controller.changePassword({ user: payload } as never, dto);
    expect(service.changePassword).toHaveBeenCalledWith('user-1', dto);
  });

  it('guards each protected route with the correct AuthGuard', () => {
    const guardsOn = (method: keyof AuthController) =>
      Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype[method]);

    expect(guardsOn('signup')).toBeUndefined();
    expect(guardsOn('signin')).toEqual([LocalAuthGuard]);
    expect(guardsOn('whoami')).toEqual([JwtAuthGuard]);
    expect(guardsOn('signout')).toEqual([JwtAuthGuard]);
    expect(guardsOn('changePassword')).toEqual([JwtAuthGuard]);
  });
});
