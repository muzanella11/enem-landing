export interface HargaEmas {
  pricePerGram: number | null;
  updatedAt: string | null;
  source: string;
  stale: boolean;
}

/** Current spot gold price (route from Story 22), shared by zakat and gold tools. */
export const useHargaEmas = () =>
  useFetch<HargaEmas>('/api/harga-emas', {
    key: 'harga-emas',
    server: false,
    default: () => ({
      pricePerGram: null,
      updatedAt: null,
      source: '',
      stale: true,
    }),
  });
