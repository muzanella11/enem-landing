import { downloadBlob } from '~/utils/browser-files';
import {
  exportStore,
  importStore,
  loadStore,
  saveStore,
  type InvoiceStore,
  emptyStore,
} from '~/utils/invoice/storage';

/**
 * The invoice/kwitansi data for this browser (Story 24), loaded from
 * localStorage on the client and saved back on every change.
 */
export const useInvoiceStore = () => {
  const store = useState<InvoiceStore>('invoice-store', emptyStore);
  const loaded = useState('invoice-store-loaded', () => false);
  const saveError = ref('');

  onMounted(() => {
    if (!loaded.value) {
      store.value = loadStore(localStorage);
      loaded.value = true;
    }
  });

  watch(
    store,
    (value) => {
      if (!loaded.value) return;
      try {
        saveStore(localStorage, value);
        saveError.value = '';
      } catch {
        saveError.value =
          'Penyimpanan browser penuh atau diblokir. Ekspor data agar tidak hilang.';
      }
    },
    { deep: true },
  );

  const exportToFile = () => {
    const blob = new Blob([exportStore(store.value)], {
      type: 'application/json',
    });
    downloadBlob(
      blob,
      `cadangan-invoice-${new Date().toISOString().slice(0, 10)}.json`,
    );
  };

  const importFromFile = async (file: File) => {
    store.value = importStore(await file.text());
  };

  return { store, loaded, saveError, exportToFile, importFromFile };
};

/** Shrinks a picked logo/QRIS image to a small data URL before it is stored. */
export const imageFileToDataUrl = async (
  file: File,
  maxSize: number,
): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // PNG keeps logos with transparency crisp; both stay small at this size.
  return canvas.toDataURL('image/png');
};
