<script setup lang="ts">
import { encodeShareState } from '~/utils/share-state';

/**
 * Builds a share link only when pressed (Story 20). State goes in the
 * fragment, which browsers never send to any server, and the link is
 * never written into this page's own address bar.
 */
const props = defineProps<{ toolId: string; state: unknown; title: string }>();
const events = useToolEvents(props.toolId);
const copied = ref(false);

const share = async () => {
  const url = `${location.origin}${location.pathname}${encodeShareState(props.toolId, props.state)}`;
  events.share();
  try {
    if (navigator.share) {
      await navigator.share({ title: props.title, url });
      return;
    }
  } catch {
    // Share sheet dismissed - fall through to copying.
  }
  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2500);
  } catch {
    window.prompt('Salin link ini:', url);
  }
};
</script>

<template>
  <button type="button" class="btn-secondary" @click="share">
    {{ copied ? 'Link disalin' : 'Bagikan hasil' }}
  </button>
</template>
