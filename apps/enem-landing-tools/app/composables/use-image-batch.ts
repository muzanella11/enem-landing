import type { OutputFormat, ProcessOptions } from '~/workers/image.worker';
import {
  downloadBlob,
  normalizeImage,
  preloadHeicDecoder,
  zipFiles,
} from '~/utils/browser-files';
import { replaceExtension } from '~/utils/files';
import type { PickedFile } from './use-file-list';

export interface ImageResult {
  id: string;
  name: string;
  originalSize: number;
  blob: Blob;
  width: number;
  height: number;
  reachedTarget: boolean;
}

export const EXTENSION_BY_FORMAT: Record<OutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Same format as the input when the browser can write it, otherwise JPEG. */
export const sameFormatAs = (file: File): OutputFormat =>
  file.type === 'image/png' || file.type === 'image/webp'
    ? file.type
    : 'image/jpeg';

/**
 * Runs a list of images through the image worker one by one (keeps memory
 * low on phones), with progress, errors per file, and ZIP download.
 */
export const useImageBatch = (toolId: string) => {
  const events = useToolEvents(toolId);
  const worker = useImageWorker();
  const results = ref<ImageResult[]>([]);
  const failures = ref<{ name: string; message: string }[]>([]);
  const busy = ref(false);
  const progress = ref('');

  onMounted(() => {
    worker.warmUp();
    preloadHeicDecoder();
  });

  const run = async (
    files: PickedFile[],
    optionsFor: (file: File) => ProcessOptions,
    mode?: string,
  ) => {
    busy.value = true;
    results.value = [];
    failures.value = [];
    events.calculate(mode);
    for (const [index, item] of files.entries()) {
      progress.value = `${index + 1} dari ${files.length}`;
      try {
        const options = optionsFor(item.file);
        const normalized = await normalizeImage(item.file);
        const result = await worker.process(normalized.blob, options);
        results.value.push({
          id: item.id,
          name: replaceExtension(
            normalized.name,
            EXTENSION_BY_FORMAT[options.format],
          ),
          originalSize: item.file.size,
          blob: result.blob,
          width: result.width,
          height: result.height,
          reachedTarget: result.reachedTarget,
        });
      } catch (error) {
        failures.value.push({
          name: item.file.name,
          message: error instanceof Error ? error.message : 'Gagal diproses',
        });
      }
    }
    busy.value = false;
    progress.value = '';
  };

  const downloadOne = (result: ImageResult) => {
    downloadBlob(result.blob, result.name);
    events.download(
      EXTENSION_BY_FORMAT[result.blob.type as OutputFormat] ?? 'image',
    );
  };

  const downloadAll = async (zipName: string) => {
    if (results.value.length === 1) {
      downloadOne(results.value[0]!);
      return;
    }
    downloadBlob(await zipFiles(results.value), zipName);
    events.download('zip');
  };

  return { results, failures, busy, progress, run, downloadOne, downloadAll };
};
