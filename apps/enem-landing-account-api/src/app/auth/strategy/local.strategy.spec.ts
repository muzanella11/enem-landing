import { LocalStrategy } from './local.strategy.js';
import { AuthService } from '../auth.service.js';
import { UserEntity } from '../../users/user.entity.js';

describe('LocalStrategy', () => {
  it('delegates credential validation to AuthService.validateUser', async () => {
    const user = { id: 'user-1' } as UserEntity;
    const authService = { validateUser: vi.fn().mockResolvedValue(user) };
    const strategy = new LocalStrategy(authService as never as AuthService);

    await expect(
      strategy.validate('admin@example.com', 'secret'),
    ).resolves.toBe(user);
    expect(authService.validateUser).toHaveBeenCalledWith(
      'admin@example.com',
      'secret',
    );
  });
});
