/**
 * Tiny promise RPC over a Web Worker (Story 23). Each call gets an id; the
 * worker answers `{ id, ok, result }` or `{ id, ok: false, error }`.
 */
export interface WorkerRequest<P = unknown> {
  id: number;
  op: string;
  payload: P;
}

export type WorkerResponse<R = unknown> =
  | { id: number; ok: true; result: R }
  | { id: number; ok: false; error: string };

export const createWorkerClient = (factory: () => Worker) => {
  let worker: Worker | null = null;
  let nextId = 1;
  const pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();

  const ensure = () => {
    if (worker) return worker;
    worker = factory();
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if (event.data.ok) entry.resolve(event.data.result);
      else entry.reject(new Error(event.data.error));
    };
    worker.onerror = (event) => {
      for (const entry of pending.values())
        entry.reject(new Error(event.message || 'Worker gagal'));
      pending.clear();
    };
    return worker;
  };

  return {
    /** Starts the worker early so its code is loaded (and works offline later). */
    warmUp: () => void ensure(),
    call: <R, P = unknown>(
      op: string,
      payload: P,
      transfer: Transferable[] = [],
    ): Promise<R> =>
      new Promise<R>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, {
          resolve: resolve as (value: unknown) => void,
          reject,
        });
        ensure().postMessage(
          { id, op, payload } satisfies WorkerRequest<P>,
          transfer,
        );
      }),
    terminate: () => {
      worker?.terminate();
      worker = null;
    },
  };
};
