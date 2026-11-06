import type {
  Results,
  SelfieSegmentation,
} from '@mediapipe/selfie_segmentation';

/**
 * Person segmentation in the browser (Story 48): MediaPipe Selfie
 * Segmentation (Apache-2.0), self-hosted under /mediapipe/selfie and only
 * loaded by the background pages. The photo never leaves the device.
 */
const BASE = '/mediapipe/selfie/';
let instance: Promise<SelfieSegmentation> | null = null;

const muatScript = () =>
  new Promise<void>((resolve, reject) => {
    if (
      (window as unknown as { SelfieSegmentation?: unknown }).SelfieSegmentation
    )
      return resolve();
    const script = document.createElement('script');
    script.src = `${BASE}selfie_segmentation.js`;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          'Model hapus latar gagal dimuat. Periksa koneksi lalu coba lagi.',
        ),
      );
    document.head.appendChild(script);
  });

const siapkan = async () => {
  await muatScript();
  const Ctor = (
    window as unknown as { SelfieSegmentation: typeof SelfieSegmentation }
  ).SelfieSegmentation;
  const model = new Ctor({ locateFile: (file) => `${BASE}${file}` });
  // 0 = general model (256x256), better for portraits than the landscape one.
  model.setOptions({ modelSelection: 0 });
  await model.initialize();
  return model;
};

export const useSegmentasi = () => {
  const muat = () =>
    (instance ??= siapkan().catch((error) => {
      instance = null;
      throw error;
    }));

  /** Confidence mask (0-255, one byte per pixel) at the source size. */
  const segmentasi = async (
    sumber: HTMLCanvasElement,
  ): Promise<Uint8ClampedArray> => {
    const model = await muat();
    const hasil = await new Promise<Results>((resolve) => {
      model.onResults(resolve);
      void model.send({ image: sumber });
    });
    const canvas = document.createElement('canvas');
    canvas.width = sumber.width;
    canvas.height = sumber.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(hasil.segmentationMask, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = new Uint8ClampedArray(canvas.width * canvas.height);
    // Depending on the GPU path the confidence is in the alpha channel (with
    // transparent background) or in the red channel of an opaque image.
    let pakaiAlpha = false;
    for (let i = 3; i < data.length; i += 4)
      if (data[i]! < 250) {
        pakaiAlpha = true;
        break;
      }
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1)
      mask[p] = pakaiAlpha ? data[i + 3]! : data[i]!;
    return mask;
  };

  return { muat, segmentasi };
};
