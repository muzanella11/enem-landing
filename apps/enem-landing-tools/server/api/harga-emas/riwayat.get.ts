import { createApiClient } from '../../utils/api-client';

/** Daily spot gold history recorded by enem-landing-api (Story 38). Empty when unavailable. */
export default defineCachedEventHandler(
  async (event) => {
    const days = Number(getQuery(event)['hari'] ?? 365);
    try {
      return (await createApiClient().get('/tools/gold-price/history', {
        params: { days: Number.isFinite(days) ? days : 365 },
      })) as unknown as { tanggal: string; pricePerGram: number }[];
    } catch {
      return [];
    }
  },
  {
    maxAge: 60 * 60,
    swr: true,
    name: 'harga-emas-riwayat',
    getKey: (event) => String(getQuery(event)['hari'] ?? 365),
  },
);
