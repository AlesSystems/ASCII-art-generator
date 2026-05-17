'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RampName, ContrastStats, PixelsToAsciiOpts } from '@ascii-art/core';
import { computeFrameStats } from '@ascii-art/core';
import type { AsciiOpts, LoadedFile } from './types';
import type { WorkerRequest, WorkerResponse } from './ascii-worker';

/**
 * React hook that converts all frames of a loaded image file to ASCII art
 * whenever its inputs change, debounced by ~120 ms to keep slider drag smooth.
 *
 * Conversion runs inside a Web Worker so playback stays smooth on the main
 * thread. Stale responses (from superseded requests) are discarded via the
 * incrementing `id` field.
 *
 * Per-GIF `frameStats` are computed once when the file loads (or its width
 * changes), so all frames share the same auto-contrast window — eliminates
 * the brightness pulse that per-frame stretching produced.
 */
export function useAscii(
  file: LoadedFile | null,
  opts: AsciiOpts
): {
  frames: string[];
  renderMs: number | null;
  isComputing: boolean;
} {
  const [frames, setFrames] = useState<string[]>([]);
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('./ascii-worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (evt: MessageEvent<WorkerResponse>) => {
      const { id, ascii, renderMs: ms } = evt.data;
      if (id !== requestIdRef.current) return;
      setFrames(ascii);
      setRenderMs(ms);
      setIsComputing(false);
    };

    worker.onerror = (err) => {
      console.error('ascii-worker error', err);
      setIsComputing(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Compute combined frameStats over the whole file so every frame uses the
  // same auto-contrast window. Only depends on the file + target width + gamma.
  const frameStats: ContrastStats | undefined = useMemo(() => {
    if (!file || file.frames.length === 0) return undefined;
    let lo = 255;
    let hi = 0;
    for (const f of file.frames) {
      const s = computeFrameStats(f.image.data, f.image.width, f.image.height, {
        width: opts.width,
        gamma: opts.gamma,
      });
      if (s.lo < lo) lo = s.lo;
      if (s.hi > hi) hi = s.hi;
    }
    if (hi <= lo) return { lo: 0, hi: 255 };
    return { lo, hi };
  }, [file, opts.width, opts.gamma]);

  useEffect(() => {
    if (!file) {
      setFrames([]);
      setRenderMs(null);
      setIsComputing(false);
      return;
    }

    setIsComputing(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const worker = workerRef.current;
      if (!worker) return;

      const rampArg: string | RampName =
        opts.ramp === 'custom'
          ? opts.customRamp || ' .:-=+*#%@'
          : opts.ramp;

      // Resolve outputMode to core's (mode, output) pair.
      const mode: PixelsToAsciiOpts['mode'] =
        opts.outputMode === 'edges' ? 'edges'
        : opts.outputMode === 'hybrid' ? 'hybrid'
        : 'brightness';
      const output: PixelsToAsciiOpts['output'] =
        opts.outputMode === 'color' ? 'html' : 'plain';

      const coreOpts: PixelsToAsciiOpts = {
        width: opts.width,
        ramp: rampArg,
        invert: opts.invert,
        output,
        mode,
        gamma: opts.gamma,
        autoContrast: opts.autoContrast,
        dither: opts.dither,
        brightness: opts.brightness,
      };

      const workerFrames = file.frames.map((f) => ({
        rgba: new Uint8ClampedArray(f.image.data),
        width: f.image.width,
        height: f.image.height,
      }));

      const id = ++requestIdRef.current;
      const request: WorkerRequest = { id, frames: workerFrames, opts: coreOpts, frameStats };
      worker.postMessage(request);
    }, 120);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [
    file,
    opts.width,
    opts.ramp,
    opts.customRamp,
    opts.invert,
    opts.brightness,
    opts.autoContrast,
    opts.dither,
    opts.gamma,
    opts.outputMode,
    opts.nonce,
    frameStats,
  ]);

  return { frames, renderMs, isComputing };
}
