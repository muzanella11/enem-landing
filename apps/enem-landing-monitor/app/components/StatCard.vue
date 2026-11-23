<script lang="ts" setup>
/** One dashboard card: a menu's most critical numbers plus a link to it. */
defineProps<{
  title: string;
  icon: string;
  to: string;
  status?: 'ok' | 'warning' | 'error' | 'unknown';
}>();
</script>

<template>
  <v-card
    rounded="lg"
    elevation="0"
    class="stat-card"
    :to="to"
    :data-testid="`card-${title.toLowerCase()}`"
  >
    <div class="stat-card__header">
      <v-icon size="20" color="primary">{{ icon }}</v-icon>
      <span class="stat-card__title">{{ title }}</span>
      <v-spacer />
      <v-icon
        v-if="status && status !== 'unknown'"
        size="12"
        :color="
          status === 'ok'
            ? 'success'
            : status === 'warning'
              ? 'warning'
              : 'error'
        "
        >mdi-circle</v-icon
      >
    </div>
    <v-divider />
    <div class="stat-card__body">
      <slot />
    </div>
  </v-card>
</template>

<style scoped>
.stat-card {
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  height: 100%;
}

.stat-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px 10px;
}

.stat-card__title {
  font-size: 14px;
  font-weight: 600;
}

.stat-card__body {
  padding: 14px 18px;
  display: grid;
  gap: 10px;
}
</style>
