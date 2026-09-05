export interface CacheEntry {
  key: string;
  ttl: number;
  sizeBytes: number;
  hits: number;
  misses: number;
  active: boolean;
}
