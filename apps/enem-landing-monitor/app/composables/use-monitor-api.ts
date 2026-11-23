/** Client-side calls to this app's BFF proxy (`server/api/monitor/[...path]`). */
export const monitorFetch = <T>(
  path: string,
  options: {
    method?: 'GET' | 'PUT' | 'DELETE' | 'POST';
    query?: Record<string, string | number | boolean | undefined>;
    body?: Record<string, unknown>;
  } = {},
): Promise<T> =>
  $fetch<T>(`/api/monitor/${path}`, {
    method: options.method ?? 'GET',
    query: Object.fromEntries(
      Object.entries(options.query ?? {}).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    ),
    body: options.body,
  });
