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
const locked = computed(() =>
  ['loading', 'verifying', 'solved', 'error'].includes(status.value),
);
const hint = computed(() => {
  switch (status.value) {
    case 'solved':
      return 'Verified';
    case 'failed':
      return 'Not quite - try the new puzzle';
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
    status.value = 'solved';
    emit('solved', token);
  } catch {
    status.value = 'failed';
    setTimeout(load, 900);
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
    class="w-full max-w-[300px] mx-auto select-none"
    data-testid="slider-captcha"
  >
    <div
      ref="container"
      class="relative w-full overflow-hidden rounded bg-slate-100"
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
          class="absolute inset-0 w-full h-full"
        />
        <img
          :src="challenge.piece"
          alt=""
          draggable="false"
          class="absolute drop-shadow-md"
          :style="{
            left: `${x * scale}px`,
            top: `${challenge.pieceY * scale}px`,
            width: `${challenge.pieceSize * scale}px`,
            height: `${challenge.pieceSize * scale}px`,
          }"
        />
      </template>
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center text-sm text-slate-500"
      >
        {{ status === 'error' ? 'Puzzle could not load' : 'Loading puzzle...' }}
      </div>
      <button
        type="button"
        class="absolute top-1 right-1 h-8 w-8 rounded-full bg-white/80 text-slate-700 text-lg leading-none hover:bg-white"
        aria-label="Load a new puzzle"
        title="New puzzle"
        :disabled="status === 'verifying' || status === 'solved'"
        @click="load"
      >
        &#x21bb;
      </button>
    </div>

    <div
      class="relative mt-2 h-10 rounded border"
      :class="{
        'border-green-600 bg-green-50': status === 'solved',
        'border-red-500 bg-red-50': status === 'failed',
        'border-slate-300 bg-slate-50':
          status !== 'solved' && status !== 'failed',
      }"
    >
      <span
        class="absolute inset-0 flex items-center justify-center pl-10 text-sm"
        :class="status === 'solved' ? 'text-green-700' : 'text-slate-500'"
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
        class="absolute top-0 h-[38px] w-10 rounded text-white text-lg font-bold touch-none focus:outline-none focus:ring-2 focus:ring-[#0E7C6B] focus:ring-offset-1 disabled:cursor-not-allowed"
        :class="
          status === 'solved'
            ? 'bg-green-600'
            : status === 'failed'
              ? 'bg-red-500'
              : 'bg-[#0E7C6B] cursor-grab active:cursor-grabbing'
        "
        :style="{ left: `${x * scale}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @keydown="onKeyDown"
      >
        <span aria-hidden="true">{{
          status === 'solved' ? '&#10003;' : '&rarr;'
        }}</span>
      </button>
    </div>
    <p v-if="error" id="captcha-error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
