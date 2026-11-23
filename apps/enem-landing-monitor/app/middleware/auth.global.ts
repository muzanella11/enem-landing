import { useAuthGuard } from '@enem-landing/frontend';
import { Role } from '@enem-landing/shared-definitions';
import { navigateTo } from 'nuxt/app';

export default defineNuxtRouteMiddleware((to) =>
  useAuthGuard(to, {
    validate: true,
    // Only SUPER_ADMIN: logs hold IPs, usernames and queries. This check
    // is for UX only; enem-landing-monitor-api enforces the same rule on
    // every endpoint.
    authorize: (user) =>
      to.path === '/unauthorized' || user.role === Role.SuperAdmin,
    onUnauthorized: () => navigateTo('/unauthorized'),
  }),
);
