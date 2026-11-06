/**
 * Letter form values kept in this browser (Story 33). One flat map: fields
 * with the same id (nama, alamat, NIK, ...) are shared between letter types.
 */
export const SURAT_STORAGE_KEY = 'elt_surat_v1';

export const parseSuratStore = (raw: unknown): Record<string, string> => {
  if (!raw || typeof raw !== 'object') return {};
  const nilai = (raw as { nilai?: unknown }).nilai;
  if (!nilai || typeof nilai !== 'object') return {};
  return Object.fromEntries(
    Object.entries(nilai as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, (value as string).slice(0, 5000)]),
  );
};

export const loadSurat = (
  storage: Pick<Storage, 'getItem'>,
): Record<string, string> => {
  try {
    return parseSuratStore(
      JSON.parse(storage.getItem(SURAT_STORAGE_KEY) ?? 'null'),
    );
  } catch {
    return {};
  }
};

export const saveSurat = (
  storage: Pick<Storage, 'setItem'>,
  nilai: Record<string, string>,
) => storage.setItem(SURAT_STORAGE_KEY, JSON.stringify({ v: 1, nilai }));
