import type { User } from '@enem-landing/shared-types';
import { onMounted, ref } from 'vue';
import { navigateTo, useRoute } from 'nuxt/app';
import { useAuthCookie } from './use-auth-cookie.js';
import { fetchWhoami } from './use-whoami.js';
import { buildAccountWebSigninUrl } from './use-auth-guard.js';

/**
 * Resolves the current user for display (profile menu, layout) once
 * `middleware/auth.global.ts` has already gated the route. Adapted from
 * mau-apps' `useAuthentication` — simplified to a one-shot `fetchWhoami`
 * call instead of mau's reactive `useFetch` + separate auth pinia store,
 * since `useAuthCookie`'s `useCookie` state is already shared/reactive
 * across composable calls within a request.
 */
export const useAuthentication = () => {
  const route = useRoute();
  const { token: activeToken, clearToken } = useAuthCookie();

  const authUser = ref<User | null>(null);
  const isLoadingUser = ref(true);

  onMounted(async () => {
    if (activeToken.value) {
      authUser.value = await fetchWhoami(activeToken.value);
    }
    isLoadingUser.value = false;
  });

  const removeAccessToken = () => {
    clearToken();
    return navigateTo(buildAccountWebSigninUrl(route), { external: true });
  };

  return {
    activeToken,
    authUser,
    isLoadingUser,

    removeAccessToken,
  };
};
