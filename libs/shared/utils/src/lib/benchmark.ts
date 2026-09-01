/**
 * Ported from mau-apps (`libs/shared/utils/src/lib/benchmark.ts`) — logs
 * execution time, heap usage, and CPU time around an async function.
 * Cheap, print-based observability; not a replacement for real APM.
 */
export const benchmark = async <T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const tag = `[${label}]`;
  const start = Date.now();
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024;

  console.log(`-------- Start ${tag} --------`);

  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    const endMem = process.memoryUsage().heapUsed / 1024 / 1024;

    console.log(
      `${tag} OK in ${durationMs}ms (heap ${startMem.toFixed(2)}MB -> ${endMem.toFixed(2)}MB)`,
    );

    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    console.error(`${tag} FAILED after ${durationMs}ms:`, error);
    throw error;
  }
};
