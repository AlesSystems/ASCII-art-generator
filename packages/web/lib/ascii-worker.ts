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
import type { PixelsToAsciiOpts, ContrastStats } from '@ascii-art/core';

export interface WorkerRequest {
  id: number;
  frames: { rgba: Uint8ClampedArray; width: number; height: number }[];
  opts: PixelsToAsciiOpts;
  // Shared across every frame in this batch — keeps auto-contrast stretch
  // consistent so GIF playback doesn't flicker.
  frameStats?: ContrastStats;
}

export interface WorkerResponse {
  id: number;
  ascii: string[];   // one per frame, same order as request
  renderMs: number;
}

interface WorkerGlobal {
  onmessage: ((evt: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(data: WorkerResponse): void;
}

(self as unknown as WorkerGlobal).onmessage = (evt: MessageEvent<WorkerRequest>) => {
  const { id, frames, opts, frameStats } = evt.data;
  const t0 = performance.now();

  const ascii: string[] = frames.map(({ rgba, width, height }) =>
    pixelsToAscii(rgba, width, height, { ...opts, frameStats })
  );

  const renderMs = Math.round(performance.now() - t0);
  const response: WorkerResponse = { id, ascii, renderMs };
  (self as unknown as WorkerGlobal).postMessage(response);
};
