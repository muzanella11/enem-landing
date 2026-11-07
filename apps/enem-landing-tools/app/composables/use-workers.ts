import type { ProcessOptions, ProcessResult } from '~/workers/image.worker';
import { createWorkerClient } from '~/utils/worker-client';

let pdfClient: ReturnType<typeof createWorkerClient> | null = null;
let imageClient: ReturnType<typeof createWorkerClient> | null = null;

/** PDF worker (pdf-lib) - created on first use, shared by all PDF tools. */
export const usePdfWorker = () => {
  pdfClient ??= createWorkerClient(
    () =>
      new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), {
        type: 'module',
      }),
  );
  return pdfClient;
};

/** Image worker (OffscreenCanvas) - shared by the image tools. */
export const useImageWorker = () => {
  imageClient ??= createWorkerClient(
    () =>
      new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
        type: 'module',
      }),
  );
  return {
    warmUp: imageClient.warmUp,
    process: (blob: Blob, options: ProcessOptions) =>
      imageClient!.call<ProcessResult>('process', { blob, options }),
  };
};
