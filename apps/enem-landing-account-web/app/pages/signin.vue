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
const showPassword = ref(false);
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
  <div
    v-if="isCheckingSession"
    class="min-h-screen flex items-center justify-center bg-white"
  >
    <p class="text-sm text-gray-400">Loading...</p>
  </div>
  <div
    v-else-if="isSignedIn"
    class="min-h-screen flex items-center justify-center bg-white"
  >
    <p class="text-sm text-gray-600">You're signed in.</p>
  </div>

  <div v-else class="fixed inset-0 flex">
    <!-- Left: Form -->
    <div class="w-full lg:w-5/12 flex flex-col bg-white overflow-y-auto">
      <div class="px-10 pt-10">
        <span class="text-lg font-semibold text-gray-900"
          >Nurfirliana Muzanella</span
        >
      </div>

      <div class="flex-1 flex items-center justify-center px-10 py-12">
        <div class="w-full max-w-sm">
          <div class="mb-8">
            <h1 class="text-3xl font-semibold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p class="text-sm text-gray-500">
              Sign in to continue to your account
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="onSubmit">
            <div class="space-y-1">
              <label
                class="block text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Email
              </label>
              <input
                id="email"
                v-model="entry.email"
                type="email"
                :disabled="isLoading"
                placeholder="you@example.com"
                autocomplete="username"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            <div class="space-y-1">
              <label
                class="block text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="entry.password"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="isLoading"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    v-if="showPassword"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="errorMessage"
              class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
            >
              <svg
                class="w-4 h-4 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 bg-[#1ABC9C] hover:bg-[#15967D] active:bg-[#128068] text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <span
                v-if="isLoading"
                class="flex items-center justify-center gap-2"
              >
                <svg
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in...
              </span>
              <span v-else>Sign in</span>
            </button>
          </form>
        </div>
      </div>

      <div class="px-10 pb-8">
        <p class="text-xs text-gray-400">
          &copy; {{ new Date().getFullYear() }} Nurfirliana Muzanella. All
          rights reserved.
        </p>
      </div>
    </div>

    <!-- Right: Brand panel -->
    <div
      class="hidden lg:flex lg:w-7/12 relative bg-[#1ABC9C] overflow-hidden items-center justify-center"
    >
      <div
        class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#3FCBAF] opacity-40"
      />
      <div
        class="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#15967D] opacity-30"
      />
      <div
        class="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-white opacity-5"
      />

      <div class="relative z-10 text-center px-12 select-none">
        <h2 class="text-white text-5xl font-bold leading-tight mb-4">
          Nurfirliana<br />Muzanella
        </h2>
        <p class="text-white/80 text-base font-light max-w-xs mx-auto">
          Frontend Engineer. Sign in to manage the enem-landing account.
        </p>
      </div>
    </div>
  </div>
</template>
