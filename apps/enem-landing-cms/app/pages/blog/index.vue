<script lang="ts" setup>
import { ref } from 'vue';
import type { BlogPost } from '@enem-landing/shared-types';
import { extractUploadId } from '@enem-landing/shared-utils';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Blog' });

const { data: posts, refresh } = await useFetch<BlogPost[]>('/api/blog-posts');
const snackbar = useGlobalSnackbar();
const router = useRouter();

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Status', key: 'status' },
  { title: 'Updated', key: 'updatedAt' },
  { title: '', key: 'actions', sortable: false },
];

const dialog = ref(false);
const isSaving = ref(false);
const title = ref('');

const openCreate = () => {
  title.value = '';
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    const created = await $fetch<BlogPost>('/api/blog-posts', {
      method: 'post',
      body: { title: title.value },
    });
    dialog.value = false;
    await refresh();
    snackbar.success('Post created.');
    if (created?.id) {
      await router.push(`/blog/${created.id}`);
    }
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

/** Every image URL a post currently references - cover plus any `insert.image` op in its Quill Delta. */
const collectImageUrls = (post: BlogPost): string[] => {
  const urls: string[] = [];
  if (post.coverImageUrl) urls.push(post.coverImageUrl);
  const ops = (post.contentDelta as { ops?: unknown[] })?.ops ?? [];
  for (const op of ops) {
    const insert = (op as { insert?: unknown })?.insert;
    if (insert && typeof insert === 'object' && 'image' in insert) {
      const image = (insert as { image?: unknown }).image;
      if (typeof image === 'string') urls.push(image);
    }
  }
  return urls;
};

const remove = async (post: BlogPost) => {
  try {
    // Whole-post delete is unambiguous (no undo concern, unlike removing a
    // single image mid-edit - see `[id].vue`), so every image the post ever
    // referenced is cleaned up eagerly, before the post row itself goes.
    for (const url of collectImageUrls(post)) {
      const uploadId = extractUploadId(url);
      if (!uploadId) continue;
      try {
        await $fetch(`/api/uploads/${uploadId}`, { method: 'delete' });
      } catch (err) {
        const status = (err as { status?: number; statusCode?: number })
          ?.status;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (status !== 404 && statusCode !== 404) throw err;
      }
    }
    await $fetch(`/api/blog-posts/${post.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Post deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};

const statusColor = (status: string) =>
  status === 'published' ? 'success' : 'warning';
</script>

<template>
  <div>
    <CListPage title="Blog" :meta="`${posts?.length ?? 0} post`">
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openCreate"
          >Add Post</v-btn
        >
      </template>

      <template #prepend>
        <div class="mb-4 d-flex ga-2">
          <v-btn to="/blog/categories" variant="tonal" size="small"
            >Categories</v-btn
          >
          <v-btn to="/blog/tags" variant="tonal" size="small">Tags</v-btn>
        </div>
      </template>

      <v-data-table
        :headers="headers"
        :items="posts ?? []"
        item-value="id"
        class="c-data-table"
      >
        <template #item.title="{ item }">
          <NuxtLink :to="`/blog/${item.id}`" class="text-primary">{{
            item.title
          }}</NuxtLink>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small">{{
            item.status
          }}</v-chip>
        </template>
        <template #item.updatedAt="{ item }">
          {{ new Date(item.updatedAt).toLocaleString() }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            :to="`/blog/${item.id}`"
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="error"
            @click="remove(item)"
          />
        </template>
      </v-data-table>
    </CListPage>

    <CModal v-model="dialog" title="Add Post" max-width="480">
      <v-text-field
        v-model="title"
        label="Title"
        variant="outlined"
        density="compact"
        hide-details="auto"
        autofocus
      />

      <template #actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save"
          >Save</v-btn
        >
      </template>
    </CModal>
  </div>
</template>
