<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type {
  BlogCategory,
  BlogPost,
  BlogTag,
} from '@enem-landing/shared-types';
import { extractUploadId } from '@enem-landing/shared-utils';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import 'quill/dist/quill.snow.css';

type DeltaOp = { insert?: unknown; [key: string]: unknown };
type Delta = { ops: DeltaOp[] };

const route = useRoute();
const id = route.params['id'] as string;

const { data: post, refresh } = await useFetch<BlogPost>(
  `/api/blog-posts/${id}`,
);
const { data: categories } = await useFetch<BlogCategory[]>(
  '/api/blog-categories',
);
const { data: tags } = await useFetch<BlogTag[]>('/api/blog-tags');
const snackbar = useGlobalSnackbar();

useHead({ title: computed(() => post.value?.title ?? 'Post') });

const isSaving = ref(false);

const form = ref({
  title: post.value?.title ?? '',
  excerpt: post.value?.excerpt ?? '',
  status: post.value?.status ?? 'draft',
  metaTitle: post.value?.metaTitle ?? '',
  metaDescription: post.value?.metaDescription ?? '',
  ogImageUrl: post.value?.ogImageUrl ?? '',
});
const categoryIds = ref<string[]>(
  post.value?.categories.map((category) => category.id) ?? [],
);
const tagIds = ref<string[]>(post.value?.tags.map((tag) => tag.id) ?? []);

// --- Cover image - staged locally, uploaded/deleted only on Save (see below). ---
const coverImageUrl = ref<string | null>(post.value?.coverImageUrl ?? null);
const pendingCoverFile = ref<File | null>(null);
const pendingCoverPreviewUrl = ref<string | null>(null);
const coverPreview = computed(
  () => pendingCoverPreviewUrl.value ?? coverImageUrl.value,
);

const onSelectCover = (files: File[] | File | null) => {
  const selected = Array.isArray(files) ? files[0] : files;
  if (!selected) return;
  if (pendingCoverPreviewUrl.value) {
    URL.revokeObjectURL(pendingCoverPreviewUrl.value);
  }
  pendingCoverFile.value = selected;
  pendingCoverPreviewUrl.value = URL.createObjectURL(selected);
};

const removeCover = () => {
  if (pendingCoverPreviewUrl.value) {
    URL.revokeObjectURL(pendingCoverPreviewUrl.value);
  }
  pendingCoverFile.value = null;
  pendingCoverPreviewUrl.value = null;
  coverImageUrl.value = null;
};

// --- Quill editor. Loaded client-only (onMounted) - Quill touches `document` at construction time, which doesn't exist during SSR. ---
const editorEl = ref<HTMLDivElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Quill's own type only exists once the client-only dynamic import below resolves; typing this as `any` avoids pulling its types into the SSR-evaluated module graph.
let quill: any = null;
// Inline images inserted this session, keyed by the local `data:` preview
// URL Quill is currently displaying - resolved to a real R2 URL at Save
// time (see `save()`), never uploaded on insert. This is what makes
// mid-edit removal (including via Quill's own Ctrl+Z) free: nothing
// external has happened yet for an image still in this map.
//
// A `data:` URL is used rather than `URL.createObjectURL`'s `blob:` one
// because Quill's built-in Image blot sanitizes every inserted src against
// an `http`/`https`/`data` allowlist and silently replaces anything else
// (blob: included) with a broken `//:0` placeholder.
const pendingContentImages = new Map<string, File>();

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const imageHandler = () => {
  if (!quill) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    pendingContentImages.set(dataUrl, file);
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image', dataUrl, 'user');
    quill.setSelection(range.index + 1, 0, 'user');
  };
  input.click();
};

/** Every real (already-persisted, non-`data:`) image URL a Delta references. */
const collectPersistedImageUrls = (delta: unknown): string[] => {
  const ops = (delta as Delta | undefined)?.ops ?? [];
  const urls: string[] = [];
  for (const op of ops) {
    const insert = op.insert;
    if (insert && typeof insert === 'object' && 'image' in insert) {
      const image = (insert as { image?: unknown }).image;
      if (typeof image === 'string' && !image.startsWith('data:')) {
        urls.push(image);
      }
    }
  }
  return urls;
};

// Snapshot of what's actually persisted in R2 for this post right now -
// taken once, before any edits. Diffed against the final image set at Save
// time to know what became orphaned (see `save()`).
const baselineImageUrls = new Set<string>([
  ...(post.value?.coverImageUrl ? [post.value.coverImageUrl] : []),
  ...collectPersistedImageUrls(post.value?.contentDelta),
]);

onMounted(async () => {
  const { default: Quill } = await import('quill');
  if (!editorEl.value) return;
  quill = new Quill(editorEl.value, {
    theme: 'snow',
    placeholder: 'Write your post…',
    modules: {
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    },
  });
  if (post.value?.contentDelta) {
    quill.setContents(post.value.contentDelta);
  }
});

onBeforeUnmount(() => {
  if (pendingCoverPreviewUrl.value) {
    URL.revokeObjectURL(pendingCoverPreviewUrl.value);
  }
});

const uploadImage = async (file: File, purpose: string): Promise<string> => {
  const body = new FormData();
  body.append('file', file);
  body.append('purpose', purpose);
  const response = await $fetch<{ data: { url: string } }>('/api/uploads', {
    method: 'post',
    body,
  });
  return response.data.url;
};

const save = async () => {
  if (!quill) return;
  isSaving.value = true;
  try {
    // 1. Resolve the Delta: upload any `data:` (newly inserted, not yet
    //    persisted) images and rewrite their op to the real R2 URL.
    const delta = quill.getContents() as Delta;
    for (const op of delta.ops) {
      const insert = op.insert;
      if (insert && typeof insert === 'object' && 'image' in insert) {
        const image = (insert as { image?: unknown }).image;
        if (typeof image === 'string' && image.startsWith('data:')) {
          const file = pendingContentImages.get(image);
          if (file) {
            const url = await uploadImage(file, 'blog-post-content');
            (insert as { image: string }).image = url;
          }
        }
      }
    }

    // 2. Resolve the cover: upload a staged file if one was selected.
    let resolvedCoverUrl = coverImageUrl.value;
    if (pendingCoverFile.value) {
      resolvedCoverUrl = await uploadImage(
        pendingCoverFile.value,
        'blog-post-cover',
      );
    }

    // 3. Save the post with the fully-resolved content.
    await $fetch<BlogPost>(`/api/blog-posts/${id}`, {
      method: 'put',
      body: {
        title: form.value.title,
        excerpt: form.value.excerpt,
        contentDelta: delta,
        coverImageUrl: resolvedCoverUrl,
        status: form.value.status,
        metaTitle: form.value.metaTitle,
        metaDescription: form.value.metaDescription,
        ogImageUrl: form.value.ogImageUrl,
        categoryIds: categoryIds.value,
        tagIds: tagIds.value,
      },
    });

    // 4. Only after the save succeeded, clean up whatever's no longer
    //    referenced - never before, so a failed save never deletes
    //    anything still in use.
    const finalImageUrls = new Set<string>([
      ...(resolvedCoverUrl ? [resolvedCoverUrl] : []),
      ...collectPersistedImageUrls(delta),
    ]);
    for (const oldUrl of baselineImageUrls) {
      if (finalImageUrls.has(oldUrl)) continue;
      const uploadId = extractUploadId(oldUrl);
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
    baselineImageUrls.clear();
    finalImageUrls.forEach((url) => baselineImageUrls.add(url));
    pendingContentImages.clear();
    coverImageUrl.value = resolvedCoverUrl;
    pendingCoverFile.value = null;
    if (pendingCoverPreviewUrl.value) {
      URL.revokeObjectURL(pendingCoverPreviewUrl.value);
      pendingCoverPreviewUrl.value = null;
    }

    await refresh();
    snackbar.success('Post saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <CFormPage :title="post?.title || 'Post'">
    <template #actions>
      <v-btn to="/blog" variant="text" prepend-icon="mdi-arrow-left"
        >Back</v-btn
      >
    </template>

    <CContentCard title="Content" class="mb-6">
      <v-text-field
        v-model="form.title"
        label="Title"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        :model-value="post?.slug"
        label="Slug (auto-generated from title, read-only)"
        variant="outlined"
        density="compact"
        hide-details="auto"
        readonly
        class="mb-4"
      />
      <v-textarea
        v-model="form.excerpt"
        label="Excerpt"
        variant="outlined"
        density="compact"
        hide-details="auto"
        rows="2"
        class="mb-4"
      />
      <div class="c-quill-wrapper">
        <div ref="editorEl" />
      </div>
    </CContentCard>

    <CContentCard title="Cover Image" class="mb-6">
      <v-file-input
        label="Upload cover image"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-2"
        accept="image/jpeg,image/png,image/webp,image/gif"
        prepend-icon=""
        prepend-inner-icon="mdi-image-plus-outline"
        @update:model-value="onSelectCover"
      />
      <div v-if="coverPreview" class="c-cover-preview mt-2">
        <v-img
          :src="coverPreview"
          max-width="240"
          aspect-ratio="1.91"
          rounded="lg"
          cover
        />
        <v-btn
          icon="mdi-close"
          size="x-small"
          color="error"
          class="c-cover-preview__remove"
          @click="removeCover"
        />
      </div>
    </CContentCard>

    <CContentCard title="Categories & Tags" class="mb-6">
      <v-select
        v-model="categoryIds"
        :items="categories ?? []"
        item-title="name"
        item-value="id"
        label="Categories"
        variant="outlined"
        density="compact"
        hide-details="auto"
        chips
        multiple
        class="mb-4"
      />
      <v-select
        v-model="tagIds"
        :items="tags ?? []"
        item-title="name"
        item-value="id"
        label="Tags"
        variant="outlined"
        density="compact"
        hide-details="auto"
        chips
        multiple
      />
    </CContentCard>

    <CContentCard title="SEO">
      <v-text-field
        v-model="form.metaTitle"
        label="Meta Title"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-textarea
        v-model="form.metaDescription"
        label="Meta Description"
        variant="outlined"
        density="compact"
        hide-details="auto"
        rows="2"
        class="mb-4"
      />
      <v-text-field
        v-model="form.ogImageUrl"
        label="OG Image URL (optional, falls back to cover image)"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />
    </CContentCard>

    <template #sidebar>
      <v-btn-toggle v-model="form.status" mandatory class="mb-4" divided>
        <v-btn value="draft">Draft</v-btn>
        <v-btn value="published">Published</v-btn>
      </v-btn-toggle>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save-outline"
        :loading="isSaving"
        block
        @click="save"
        >Save</v-btn
      >
    </template>
  </CFormPage>
</template>

<style scoped>
.c-quill-wrapper :deep(.ql-editor) {
  min-height: 320px;
}

.c-cover-preview {
  /* `v-img`'s `aspect-ratio` prop needs a definite width to compute a
     height from - an inline-block parent with no width of its own leaves
     it 0x0. */
  position: relative;
  display: inline-block;
  width: 240px;
}

.c-cover-preview__remove {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
