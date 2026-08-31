<script lang="ts" setup>
import { fetchWhoami, useAuthCookie } from '@enem-landing/frontend';
import { ensureHttps } from '@enem-landing/shared-utils';

definePageMeta({ layout: false });

interface SigninResponse {
  statusCode: number;
  message: string;
  data?: { token: string };
}

const route = useRoute();
const { token: activeToken, setToken } = useAuthCookie();

const isLoading = ref(false);
const isCheckingSession = ref(true);
const isSignedIn = ref(false);
const errorMessage = ref('');
const entry = reactive({ email: '', password: '' });

// `null` when there's nowhere to send the user back to — a direct visit to
// /signin with no `r` (not part of any redirect-based SSO flow). Redirecting
// to `/` in that case would loop forever: index.vue sends unauthenticated
// visitors to /signin, and an authenticated visitor landing back on /signin
// with no `r` would just end up here again.
const redirectTarget = computed(() => {
  const r = route.query['r'];
  return typeof r === 'string' && r ? ensureHttps(r) : null;
});

// Mirrors mau-apps' useMauAuthBounceBack: if the shared cookie is already
// valid when landing on /signin?r=..., skip the form entirely.
onMounted(async () => {
  if (activeToken.value) {
    const user = await fetchWhoami(activeToken.value);
    if (user) {
      if (redirectTarget.value) {
        await navigateTo(redirectTarget.value, { external: true });
        return;
      }
      isSignedIn.value = true;
      isCheckingSession.value = false;
      return;
    }
  }
  isCheckingSession.value = false;
});

const onSubmit = async () => {
  errorMessage.value = '';

  if (!entry.email || !entry.password) {
    errorMessage.value = 'Email and password are required.';
    return;
  }

  isLoading.value = true;

  try {
    const response = await $fetch<SigninResponse>('/api/auth/signin', {
      method: 'post',
      headers: { 'x-enem-landing-secret': 'Secret' },
      body: entry,
    });

    if (!response.data?.token) {
      throw new Error('Sign in failed.');
    }

    setToken(response.data.token);
    if (redirectTarget.value) {
      await navigateTo(redirectTarget.value, { external: true });
    } else {
      isSignedIn.value = true;
    }
  } catch (err) {
    errorMessage.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      (err as Error)?.message ||
      'Failed to sign in. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div v-if="isCheckingSession" class="min-h-screen flex items-center justify-center bg-gray-50">
    <p class="text-sm text-gray-400">Loading...</p>
  </div>
  <div v-else-if="isSignedIn" class="min-h-screen flex items-center justify-center bg-gray-50">
    <p class="text-sm text-gray-600">You're signed in.</p>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-semibold text-gray-900 mb-1">enem-landing</h1>
      <p class="text-sm text-gray-500 mb-8">Sign in to continue</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            id="email"
            v-model="entry.email"
            type="email"
            :disabled="isLoading"
            autocomplete="username"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          />
        </div>

        <div>
          <label for="password" class="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <input
            id="password"
            v-model="entry.password"
            type="password"
            :disabled="isLoading"
            autocomplete="current-password"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
