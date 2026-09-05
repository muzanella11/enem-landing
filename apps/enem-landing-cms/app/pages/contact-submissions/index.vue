<script lang="ts" setup>
import type { ContactSubmission } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const { data: submissions, refresh } = await useFetch<ContactSubmission[]>(
  '/api/contact-submissions',
);
const snackbar = useGlobalSnackbar();

const headers = [
  { title: 'Name', key: 'fullname' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phoneNumber' },
  { title: 'Message', key: 'message' },
  { title: 'Submitted', key: 'createdAt' },
  { title: 'Status', key: 'readAt' },
  { title: '', key: 'actions', sortable: false },
];

const markAsRead = async (submission: ContactSubmission) => {
  try {
    await $fetch(`/api/contact-submissions/${submission.id}/read`, {
      method: 'patch',
    });
    await refresh();
    snackbar.success('Marked as read.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <CListPage
    title="Contact Submissions"
    :meta="`${submissions?.length ?? 0} submission`"
  >
    <v-data-table
      :headers="headers"
      :items="submissions ?? []"
      item-value="id"
      class="c-data-table"
    >
      <template #item.readAt="{ item }">
        <v-chip v-if="item.readAt" size="small" color="success" variant="tonal"
          >Read</v-chip
        >
        <v-chip v-else size="small" color="warning" variant="tonal"
          >Unread</v-chip
        >
      </template>
      <template #item.createdAt="{ item }">
        <span class="text-medium-emphasis">{{
          new Date(item.createdAt).toLocaleString('id-ID')
        }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="!item.readAt"
          size="small"
          variant="text"
          color="primary"
          @click="markAsRead(item)"
          >Mark as read</v-btn
        >
      </template>
    </v-data-table>
  </CListPage>
</template>
