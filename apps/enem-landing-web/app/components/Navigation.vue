<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ title: string }>();

const NAV_ITEMS = [
  { href: '#experience', label: 'Experience' },
  { href: '#portfolio', label: 'Portfolio' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

const isOpen = ref(false);
const isShrunk = ref(false);

const onScroll = () => {
  isShrunk.value = window.scrollY > 0;
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll);
});
onUnmounted(() => window.removeEventListener('scroll', onScroll));

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
          class="lg:hidden px-3 py-2 rounded bg-[#1ABC9C] uppercase text-xs font-bold"
          @click="isOpen = !isOpen"
        >
          Menu
        </button>

        <ul
          class="hidden lg:flex items-center gap-1 text-sm font-bold tracking-wide"
        >
          <li v-for="item in NAV_ITEMS" :key="item.href">
            <a
              :href="item.href"
              class="block px-3 py-3 rounded hover:text-[#1ABC9C] transition-colors"
              @click.prevent="scrollTo(item.href)"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>

      <ul
        v-if="isOpen"
        class="lg:hidden pt-4 pb-2 space-y-1 text-sm font-bold tracking-wide"
      >
        <li v-for="item in NAV_ITEMS" :key="item.href">
          <a
            :href="item.href"
            class="block py-1"
            @click.prevent="scrollTo(item.href)"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
