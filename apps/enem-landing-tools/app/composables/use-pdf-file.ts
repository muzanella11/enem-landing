import { parsePageRanges } from '~/utils/files';
import { pilihHalaman } from '~/utils/files/pdf-placement';

/** One picked PDF plus its page count and a page selection (Story 32 tools). */
export const usePdfFile = () => {
  const file = ref<File | null>(null);
  const pageCount = ref(0);
  const error = ref('');
  const semua = ref(true);
  const ranges = ref('');

  onMounted(() => usePdfWorker().warmUp());

  const pick = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return false;
    error.value = '';
    try {
      const bytes = await picked.arrayBuffer();
      const info = await usePdfWorker().call<{ pageCount: number }>(
        'info',
        { bytes },
        [bytes],
      );
      file.value = picked;
      pageCount.value = info.pageCount;
      ranges.value = `1-${info.pageCount}`;
      return true;
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'PDF tidak bisa dibaca.';
      file.value = null;
      return false;
    }
  };

  /** 0-based selected pages, or null with `error` set. */
  const selectedPages = (): number[] | null => {
    try {
      return pilihHalaman(
        semua.value ? 'semua' : parsePageRanges(ranges.value, pageCount.value),
        pageCount.value,
      );
    } catch (caught) {
      error.value = (caught as Error).message;
      return null;
    }
  };

  const baseName = computed(
    () => file.value?.name.replace(/\.pdf$/i, '') ?? 'dokumen',
  );

  return {
    file,
    pageCount,
    error,
    semua,
    ranges,
    pick,
    selectedPages,
    baseName,
  };
};
