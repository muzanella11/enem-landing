import { useAuthGuard } from '@enem-landing/frontend';
import { Role } from '@enem-landing/shared-definitions';
import { navigateTo } from 'nuxt/app';

export default defineNuxtRouteMiddleware((to) =>
  useAuthGuard(to, {
    validate: true,
    // Excluding /unauthorized itself avoids looping the redirect below back onto this check.
    authorize: (user) =>
      to.path === '/unauthorized' ||
      user.role === Role.Admin ||
      user.role === Role.SuperAdmin,
    // Internal redirect to this CMS's own 403 page, not enem-landing-web -
    // authorization happens before the page renders so a non-admin never
    // sees a flash of CMS content.
    onUnauthorized: () => navigateTo('/unauthorized'),
  }),
);
