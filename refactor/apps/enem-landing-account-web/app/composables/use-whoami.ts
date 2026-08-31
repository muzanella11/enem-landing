import type { User } from '@enem-landing/shared-types';

interface WhoamiResponse {
  statusCode: number;
  message: string;
  data?: User;
}

/**
 * Calls this app's own `/api/auth/whoami` BFF route to check whether a
 * token is still valid, rather than trusting that the cookie merely
 * exists. Mirrors mau-apps' `fetchMauWhoami`.
 */
export const fetchWhoami = (token: string): Promise<User | null> =>
  $fetch<WhoamiResponse>('/api/auth/whoami', {
    method: 'post',
    headers: {
      'x-enem-landing-secret': 'Secret',
      'x-enem-landing-authorization': `Bearer ${token}`,
    },
  })
    .then((res) => res.data ?? null)
    .catch(() => null);
