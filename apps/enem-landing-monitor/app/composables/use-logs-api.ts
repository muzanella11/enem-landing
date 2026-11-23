/** Client-side calls to this app's own BFF (`server/api/logs/[...path]`). */
export const logsFetch = <T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T> =>
  $fetch<T>(`/api/logs/${path}`, {
    query: Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    ),
  });

export const errorMessage = (error: unknown): string => {
  const fetchError = error as {
    statusMessage?: string;
    data?: { statusMessage?: string; message?: string };
    message?: string;
  };
  return (
    fetchError.data?.statusMessage ||
    fetchError.data?.message ||
    fetchError.statusMessage ||
    fetchError.message ||
    'Gagal memuat data'
  );
};
