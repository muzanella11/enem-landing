export interface HargaEmas {
  pricePerGram: number | null;
  updatedAt: string | null;
  source: string;
  stale: boolean;
}

/**
 * Current spot gold price (route from Story 22), shared by zakat and gold
 * tools. Fetched on the client only (`server: false`), so during SSR the
 * request is 'idle'. `pending` counts that as loading too: otherwise the
 * server rendered the "price unavailable" branch while the hydrating client
 * rendered "loading", a hydration mismatch logged as a console error
 * (PageSpeed best practices).
 */
export const useHargaEmas = () => {
  const result = useFetch<HargaEmas>('/api/harga-emas', {
    key: 'harga-emas',
    server: false,
    default: () => ({
      pricePerGram: null,
      updatedAt: null,
      source: '',
      stale: true,
    }),
  });
  const pending = computed(
    () => result.status.value === 'idle' || result.status.value === 'pending',
  );
  return { ...result, pending };
};
