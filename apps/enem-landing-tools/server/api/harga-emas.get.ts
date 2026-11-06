/**
 * Gold price per gram in rupiah for the zakat calculator (Story 22).
 * Fetched server-side so visitors' browsers never call a third party,
 * cached for 6 hours, and the last good value is kept so a failing source
 * degrades to "price from <date>" instead of an error. Only this price is
 * served here - no user input ever reaches this route.
 */
const TROY_OUNCE_GRAMS = 31.1034768;
const STORAGE_KEY = 'harga-emas:last';
const SOURCE_TIMEOUT_MS = 5000;

interface GoldPrice {
  pricePerGram: number | null;
  updatedAt: string | null;
  source: string;
  stale: boolean;
}

const fetchJson = async <T>(url: string): Promise<T> =>
  $fetch<T>(url, { timeout: SOURCE_TIMEOUT_MS, retry: 1 });

const fetchFresh = async (): Promise<GoldPrice> => {
  const [gold, fx] = await Promise.all([
    fetchJson<{ price: number; updatedAt: string }>(
      'https://api.gold-api.com/price/XAU',
    ),
    fetchJson<{ rates: Record<string, number> }>(
      'https://open.er-api.com/v6/latest/USD',
    ),
  ]);
  const usdIdr = fx.rates['IDR'];
  if (!gold.price || !usdIdr) throw new Error('Incomplete gold/FX data');
  return {
    pricePerGram: Math.round((gold.price * usdIdr) / TROY_OUNCE_GRAMS),
    updatedAt: gold.updatedAt,
    source:
      'Harga spot emas internasional (gold-api.com) x kurs USD/IDR (exchangerate-api.com)',
    stale: false,
  };
};

export default defineCachedEventHandler(
  async (): Promise<GoldPrice> => {
    const storage = useStorage('cache');
    try {
      const fresh = await fetchFresh();
      await storage.setItem(STORAGE_KEY, fresh);
      return fresh;
    } catch (error) {
      console.warn('[harga-emas] source failed, using last known price', error);
      const last = await storage.getItem<GoldPrice>(STORAGE_KEY);
      if (last) return { ...last, stale: true };
      return {
        pricePerGram: null,
        updatedAt: null,
        source: 'tidak tersedia',
        stale: true,
      };
    }
  },
  { maxAge: 6 * 60 * 60, swr: true, name: 'harga-emas', getKey: () => 'v1' },
);
