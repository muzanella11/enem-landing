import { encodeShareState } from './share-state';

/**
 * Link that opens the net salary calculator pre-filled (Story 26). The
 * numbers travel in the URL fragment like any share link (Story 20), so
 * they never reach a server or an ad script.
 */
export const gajiLink = (fields: {
  gajiPokok?: number;
  tunjanganTetap?: number;
  tunjanganTidakTetap?: number;
}) =>
  `/kalkulator-gaji-bersih${encodeShareState('kalkulator-gaji-bersih', fields)}`;
