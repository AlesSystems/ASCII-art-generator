/**
 * Web Worker — converts batches of frames to ASCII off the main thread.
 *
 * Protocol:
 *   Inbound  (main -> worker): WorkerRequest
 *   Outbound (worker -> main): WorkerResponse
 *
 * The `id` field lets the main thread discard stale responses when the user
 * changes options faster than one conversion cycle.
 */

import { pixelsToAscii } from '@ascii-art/core';
import type { PixelsToAsciiOpts } from '@ascii-art/core';

export interface WorkerRequest {
  id: number;
  frames: { rgba: Uint8ClampedArray; width: number; height: number }[];
  opts: PixelsToAsciiOpts;
}

export interface WorkerResponse {
  id: number;
  ascii: string[];   // one per frame, same order as request
  renderMs: number;
}

// Minimal interface for the parts of DedicatedWorkerGlobalScope we use.
// We avoid referencing DedicatedWorkerGlobalScope directly because Next.js's
// TypeScript project config doesn't include the 'webworker' lib targets.
interface WorkerGlobal {
  onmessage: ((evt: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(data: WorkerResponse): void;
}

// self in a Web Worker is DedicatedWorkerGlobalScope; we cast it to our minimal interface.
(self as unknown as WorkerGlobal).onmessage = (evt: MessageEvent<WorkerRequest>) => {
  const { id, frames, opts } = evt.data;
  const t0 = performance.now();

  const ascii: string[] = frames.map(({ rgba, width, height }) =>
    pixelsToAscii(rgba, width, height, opts)
  );

  const renderMs = Math.round(performance.now() - t0);
  const response: WorkerResponse = { id, ascii, renderMs };
  (self as unknown as WorkerGlobal).postMessage(response);
};
