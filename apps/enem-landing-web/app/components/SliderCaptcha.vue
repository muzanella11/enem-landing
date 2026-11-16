<script lang="ts" setup>
import type { CaptchaChallenge } from '@enem-landing/shared-types';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Slider puzzle captcha: drag the piece into its hole. The server draws the
 * puzzle and checks the answer (position and drag movement); a solved
 * puzzle yields a single-use token for the contact submission.
 *
 * Keyboard: focus the handle, move with the arrow keys (Shift for bigger
 * steps), confirm with Enter.
 */
type ActiveChallenge = Extract<CaptchaChallenge, { enabled: true }>;
type Status =
  'loading' | 'idle' | 'dragging' | 'verifying' | 'solved' | 'failed' | 'error';

const emit = defineEmits<{
  solved: [token: string];
  disabled: [];
  reset: [];
}>();

defineProps<{ error?: string }>();

const challenge = ref<ActiveChallenge | null>(null);
const status = ref<Status>('loading');
const x = ref(0);
const scale = ref(1);
const container = ref<HTMLElement | null>(null);
/** Seconds the solving drag took, shown once verified. */
const solvedIn = ref('');

let trail: [number, number, number][] = [];
let dragStart = 0;
let pointerStartX = 0;
let pieceStartX = 0;
let lastY = 0;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;

const maxX = computed(() =>
  challenge.value ? challenge.value.width - challenge.value.pieceSize : 0,
);
/** Handle width in px (matches `w-11`). */
const HANDLE = 44;
const fillWidth = computed(() => `${x.value * scale.value + HANDLE}px`);
const locked = computed(() =>
  ['loading', 'verifying', 'solved', 'error'].includes(status.value),
);
const hint = computed(() => {
  switch (status.value) {
    case 'solved':
      return 'Verified';
    case 'failed':
      return 'Loading a new puzzle...';
    case 'verifying':
      return 'Checking...';
    case 'error':
      return 'Puzzle could not load';
    default:
      return 'Slide to fit the puzzle piece';
  }
});

const updateScale = () => {
  if (!container.value || !challenge.value) return;
  scale.value = Math.min(
    1,
    container.value.clientWidth / challenge.value.width,
  );
};

const load = async () => {
  clearTimeout(expiryTimer);
  status.value = 'loading';
  x.value = 0;
  trail = [];
  solvedIn.value = '';
  try {
    const result = await $fetch<CaptchaChallenge>('/api/captcha/challenge');
    if (!result.enabled) {
      challenge.value = null;
      emit('disabled');
      return;
    }
    challenge.value = result;
    status.value = 'idle';
    requestAnimationFrame(updateScale);
    // Fetch a new puzzle a little before the server forgets this one.
    expiryTimer = setTimeout(
      load,
      Math.max(10, result.expiresInSeconds - 10) * 1000,
    );
  } catch {
    status.value = 'error';
  }
};

/** Starts over with a new puzzle (after a submission used the token). */
const reset = () => {
  emit('reset');
  void load();
};

defineExpose({ reset });

const record = (y = lastY) => {
  lastY = y;
  trail.push([
    Math.round(x.value * 100) / 100,
    y,
    Math.round(performance.now() - dragStart),
  ]);
};

const verify = async () => {
  if (!challenge.value) return;
  status.value = 'verifying';
  const durationMs = Math.round(performance.now() - dragStart);
  try {
    const { token } = await $fetch<{ token: string }>('/api/captcha/verify', {
      method: 'POST',
      body: {
        id: challenge.value.id,
        x: Math.round(x.value * 100) / 100,
        durationMs,
        trail: trail.slice(-600),
      },
    });
    clearTimeout(expiryTimer);
    solvedIn.value = (durationMs / 1000).toFixed(1);
    status.value = 'solved';
    emit('solved', token);
  } catch {
    status.value = 'failed';
    // Shake, then slide the piece home before the next puzzle loads.
    setTimeout(() => {
      x.value = 0;
    }, 450);
    setTimeout(load, 1100);
  }
};

const onPointerDown = (event: PointerEvent) => {
  if (locked.value || status.value === 'failed') return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  status.value = 'dragging';
  dragStart = performance.now();
  pointerStartX = event.clientX;
  pieceStartX = x.value;
  trail = [];
  record(Math.round(event.clientY));
};

const onPointerMove = (event: PointerEvent) => {
  if (status.value !== 'dragging') return;
  const delta = (event.clientX - pointerStartX) / scale.value;
  x.value = Math.min(maxX.value, Math.max(0, pieceStartX + delta));
  record(Math.round(event.clientY));
};

const onPointerUp = () => {
  if (status.value !== 'dragging') return;
  record();
  if (x.value < 2) {
    status.value = 'idle';
    return;
  }
  void verify();
};

const onKeyDown = (event: KeyboardEvent) => {
  if (locked.value || status.value === 'failed') return;
  const step = event.shiftKey ? 10 : 2;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    if (status.value !== 'dragging') {
      status.value = 'dragging';
      dragStart = performance.now();
      trail = [];
      record();
    }
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    x.value = Math.min(maxX.value, Math.max(0, x.value + direction * step));
    record();
  } else if (event.key === 'Enter' && status.value === 'dragging') {
    event.preventDefault();
    record();
    void verify();
  }
};

onMounted(() => {
  void load();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScale);
    if (container.value) resizeObserver.observe(container.value);
  }
});

onBeforeUnmount(() => {
  clearTimeout(expiryTimer);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    class="captcha w-full max-w-[332px] mx-auto select-none rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
    :class="{ 'captcha--failed': status === 'failed' }"
    data-testid="slider-captcha"
  >
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <svg
          class="h-4 w-4 text-[#0E7C6B]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
          <path v-if="status === 'solved'" d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
        Security check
      </p>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0E7C6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C6B] disabled:opacity-40"
        aria-label="Load a new puzzle"
        title="New puzzle"
        :disabled="status === 'verifying' || status === 'solved'"
        @click="load"
      >
        <svg
          class="h-4 w-4"
          :class="{ 'animate-spin': status === 'loading' }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
      </button>
    </div>

    <div
      ref="container"
      class="relative w-full overflow-hidden rounded-lg bg-slate-200"
      :style="{
        aspectRatio: challenge
          ? `${challenge.width} / ${challenge.height}`
          : '300 / 160',
      }"
    >
      <template v-if="challenge">
        <img
          :src="challenge.background"
          alt=""
          draggable="false"
          class="absolute inset-0 h-full w-full"
        />
        <img
          :src="challenge.piece"
          alt=""
          draggable="false"
          class="captcha__piece absolute"
          :class="{
            'captcha__piece--lifted': status === 'dragging',
            'captcha__piece--settle': status !== 'dragging',
            'captcha__piece--shake': status === 'failed',
          }"
          :style="{
            left: `${x * scale}px`,
            top: `${challenge.pieceY * scale}px`,
            width: `${challenge.pieceSize * scale}px`,
            height: `${challenge.pieceSize * scale}px`,
          }"
        />
        <div
          v-if="status === 'solved'"
          class="captcha__shine pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
      </template>
      <div
        v-else
        class="captcha__skeleton absolute inset-0 flex items-center justify-center text-sm text-slate-500"
      >
        {{ status === 'error' ? 'Puzzle could not load' : 'Loading puzzle...' }}
      </div>

      <Transition name="captcha-banner">
        <div
          v-if="status === 'solved' || status === 'failed'"
          class="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
          :class="status === 'solved' ? 'bg-green-600/90' : 'bg-red-500/90'"
          aria-hidden="true"
        >
          <span>{{ status === 'solved' ? '&#10003;' : '&#10005;' }}</span>
          {{
            status === 'solved'
              ? `Solved in ${solvedIn}s`
              : 'The piece did not fit'
          }}
        </div>
      </Transition>
    </div>

    <div
      class="relative mt-3 h-11 overflow-hidden rounded-full border shadow-inner transition-colors"
      :class="{
        'border-green-500 bg-green-50': status === 'solved',
        'border-red-400 bg-red-50': status === 'failed',
        'border-slate-200 bg-slate-100':
          status !== 'solved' && status !== 'failed',
      }"
    >
      <div
        class="absolute inset-y-0 left-0 rounded-full"
        :class="[
          status === 'solved'
            ? 'bg-green-500/25'
            : status === 'failed'
              ? 'bg-red-400/25'
              : 'bg-[#0E7C6B]/15',
          { 'captcha__settle-width': status !== 'dragging' },
        ]"
        :style="{ width: x > 0 ? fillWidth : '0px' }"
        aria-hidden="true"
      />
      <span
        class="absolute inset-0 flex items-center justify-center pl-11 text-sm font-medium transition-opacity"
        :class="{
          'opacity-0': x > 0,
          'text-green-700': status === 'solved',
          'text-red-600': status === 'failed',
          'captcha__hint text-slate-500':
            status !== 'solved' && status !== 'failed',
        }"
        aria-live="polite"
      >
        {{ hint }}
      </span>
      <button
        type="button"
        role="slider"
        aria-label="Slide the puzzle piece into place"
        :aria-valuemin="0"
        :aria-valuemax="maxX"
        :aria-valuenow="Math.round(x)"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? 'captcha-error' : undefined"
        :disabled="locked"
        class="absolute top-0 flex h-[42px] w-11 items-center justify-center rounded-full text-white shadow-md touch-none transition-[background-color,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C6B] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        :class="[
          status === 'solved'
            ? 'bg-green-600'
            : status === 'failed'
              ? 'bg-red-500'
              : 'bg-gradient-to-br from-[#14a08a] to-[#0E7C6B] cursor-grab hover:scale-105 active:cursor-grabbing',
          { 'captcha__settle-left': status !== 'dragging' },
        ]"
        :style="{ left: `${x * scale}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @keydown="onKeyDown"
      >
        <svg
          v-if="status === 'verifying'"
          class="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-opacity="0.3"
            stroke-width="3"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
        <svg
          v-else
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-if="status === 'solved'" d="m5 12.5 4.5 4.5L19 7.5" />
          <path v-else-if="status === 'failed'" d="M7 7l10 10M17 7 7 17" />
          <path v-else d="M5 12h14m-5-5 5 5-5 5" />
        </svg>
      </button>
    </div>
    <p v-if="error" id="captcha-error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.captcha__piece {
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.45));
  transition:
    transform 0.15s ease,
    filter 0.15s ease;
}
.captcha__piece--lifted {
  transform: scale(1.04);
  filter: drop-shadow(0 6px 8px rgb(0 0 0 / 0.5));
}
.captcha__piece--settle,
.captcha__settle-left {
  transition-property: left, transform, filter, background-color;
  transition-duration: 0.45s;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
.captcha__settle-width {
  transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.captcha__piece--shake {
  animation: captcha-shake 0.4s ease;
}

/* "Slide to unlock" style light sweep across the hint. */
.captcha__hint {
  background: linear-gradient(
      90deg,
      #64748b 0%,
      #64748b 40%,
      #e2f5f1 50%,
      #64748b 60%,
      #64748b 100%
    )
    0 0 / 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: captcha-hint 2.6s linear infinite;
}

.captcha__shine {
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgb(255 255 255 / 0.55) 50%,
    transparent 70%
  );
  background-size: 250% 100%;
  animation: captcha-shine 0.9s ease-out forwards;
}

.captcha__skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%) 0
    0 / 200% 100%;
  animation: captcha-hint 1.4s linear infinite;
}

.captcha-banner-enter-active,
.captcha-banner-leave-active {
  transition: transform 0.25s ease;
}
.captcha-banner-enter-from,
.captcha-banner-leave-to {
  transform: translateY(100%);
}

@keyframes captcha-hint {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -150% 0;
  }
}
@keyframes captcha-shine {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@keyframes captcha-shake {
  0%,
  100% {
    translate: 0;
  }
  20%,
  60% {
    translate: -6px;
  }
  40%,
  80% {
    translate: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .captcha *,
  .captcha *::before {
    animation: none !important;
    transition: none !important;
  }
  .captcha__hint {
    color: #64748b;
    background: none;
  }
}
</style>
