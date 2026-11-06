/**
 * Background colour presets (Story 48). There is no single official shade:
 * institutions only say "merah" or "biru", so these are common values and
 * a custom colour is always available.
 */
export const WARNA_LATAR = [
  { id: 'merah', label: 'Merah', hex: '#DB1514' },
  { id: 'biru', label: 'Biru', hex: '#1E5AA8' },
  { id: 'putih', label: 'Putih', hex: '#FFFFFF' },
] as const;

export const LISENSI_MODEL = {
  label: 'MediaPipe Selfie Segmentation (Google), lisensi Apache-2.0',
  url: 'https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/selfie_segmentation.md',
};
