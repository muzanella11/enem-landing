<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

defineProps<{ title: string }>();

const NAV_ITEMS = [
  { href: '#experience', label: 'Experience' },
  { href: '#portfolio', label: 'Portfolio' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

const isOpen = ref(false);
const isShrunk = ref(false);
const activeHref = ref('');

// Underline sliding along the bottom edge of the nav bar itself (not just
// the link) under the active desktop item - measured directly off the two
// elements' rects so it stays aligned whether or not the nav has shrunk.
const navEl = ref<HTMLElement | null>(null);
const linkEls = new Map<string, HTMLAnchorElement>();
const setLinkRef = (href: string, el: unknown) => {
  if (el instanceof HTMLAnchorElement) linkEls.set(href, el);
  else linkEls.delete(href);
};
const indicator = reactive({ left: 0, width: 0, visible: false });

const updateIndicator = () => {
  const activeEl = activeHref.value ? linkEls.get(activeHref.value) : null;
  if (!activeEl || !navEl.value) {
    indicator.visible = false;
    return;
  }
  const linkRect = activeEl.getBoundingClientRect();
  const navRect = navEl.value.getBoundingClientRect();
  indicator.left = linkRect.left - navRect.left;
  indicator.width = linkRect.width;
  indicator.visible = true;
};

watch(activeHref, () => nextTick(updateIndicator));

const onScroll = () => {
  isShrunk.value = window.scrollY > 0;

  if (window.scrollY < 10) {
    activeHref.value = '';
    return;
  }

  // The last section often can't be scrolled far enough for the
  // IntersectionObserver band below to ever reach it (no page content left
  // beneath it to keep scrolling into view) - once the user has hit the
  // bottom of the page, just force it active directly.
  const scrolledToBottom =
    window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
  if (scrolledToBottom) {
    activeHref.value = NAV_ITEMS[NAV_ITEMS.length - 1]?.href ?? '';
  }
};

let sectionObserver: IntersectionObserver | undefined;

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll);
  window.addEventListener('resize', updateIndicator);

  // A thin horizontal band just under the fixed nav bar - whichever
  // section is crossing it is the one the user is currently reading.
  // Ignored right at the top of the page: the very first callback fires
  // synchronously from `.observe()` against whatever layout exists at that
  // instant, which can wrongly report the first section as already
  // intersecting before images/fonts above it finish loading and push it
  // down to its real position.
  sectionObserver = new IntersectionObserver(
    (entries) => {
      if (window.scrollY < 10) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeHref.value = `#${entry.target.id}`;
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );

  for (const item of NAV_ITEMS) {
    const el = document.querySelector(item.href);
    if (el) sectionObserver.observe(el);
  }
});
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', updateIndicator);
  sectionObserver?.disconnect();
});

const scrollTo = (href: string) => {
  isOpen.value = false;
  const el = document.querySelector(href);
  if (el instanceof HTMLElement) {
    window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }
};
</script>

<template>
  <nav
    ref="navEl"
    class="fixed top-0 inset-x-0 z-50 bg-[#2C3E50] text-white uppercase transition-[padding] duration-300"
    :class="isShrunk ? 'py-2' : 'py-4 lg:py-6'"
  >
    <div class="max-w-5xl mx-auto px-4">
      <div class="flex items-center justify-between">
        <a
          href="#"
          class="font-bold tracking-wide transition-[font-size] duration-300"
          :class="isShrunk ? 'text-xl' : 'text-xl lg:text-2xl'"
          @click.prevent="scrollTo('body')"
        >
          {{ title }}
        </a>

        <button
          class="lg:hidden px-3 py-2 rounded bg-[#0E7C6B] uppercase text-xs font-bold"
          @click="isOpen = !isOpen"
        >
          Menu
        </button>

        <ul
          class="hidden lg:flex items-center gap-1 text-sm font-bold tracking-wide"
        >
          <li v-for="item in NAV_ITEMS" :key="item.href">
            <a
              :ref="(el) => setLinkRef(item.href, el)"
              :href="item.href"
              class="block px-3 py-3 rounded hover:text-[#0E7C6B] transition-colors duration-300"
              :class="{ 'text-[#0E7C6B]': activeHref === item.href }"
              @click.prevent="scrollTo(item.href)"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>

      <span
        class="nav-indicator absolute bottom-0 h-[3px] rounded-full bg-[#0E7C6B] pointer-events-none"
        :class="indicator.visible ? 'opacity-100' : 'opacity-0'"
        :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
      />

      <ul
        v-if="isOpen"
        class="lg:hidden pt-4 pb-2 space-y-1 text-sm font-bold tracking-wide"
      >
        <li v-for="item in NAV_ITEMS" :key="item.href">
          <a
            :href="item.href"
            class="block py-1"
            :class="{ 'text-[#0E7C6B]': activeHref === item.href }"
            @click.prevent="scrollTo(item.href)"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.nav-indicator {
  transition:
    left 400ms cubic-bezier(0.65, 0, 0.35, 1),
    width 400ms cubic-bezier(0.65, 0, 0.35, 1),
    opacity 200ms ease;
}
</style>
