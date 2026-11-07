import { softBatchLimitBytes } from '~/utils/files';

export interface PickedFile {
  id: string;
  file: File;
}

/** Ordered list of picked files with reorder/remove, shared by the file tools. */
export const useFileList = () => {
  const files = ref<PickedFile[]>([]);

  const add = (incoming: File[]) => {
    files.value.push(
      ...incoming.map((file) => ({ id: crypto.randomUUID(), file })),
    );
  };
  const remove = (id: string) => {
    files.value = files.value.filter((item) => item.id !== id);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.value.length) return;
    const next = [...files.value];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    files.value = next;
  };
  const clear = () => {
    files.value = [];
  };

  const totalBytes = computed(() =>
    files.value.reduce((sum, item) => sum + item.file.size, 0),
  );
  const overSoftLimit = computed(() => {
    if (import.meta.server) return false;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    return totalBytes.value > softBatchLimitBytes(memory);
  });

  return { files, add, remove, move, clear, totalBytes, overSoftLimit };
};
