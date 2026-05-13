'use client';

import { useEffect, useRef, useState } from 'react';
import type { RampName } from '@ascii-art/core';
import { applyContrast } from './contrast';
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
 * Returns:
 *   frames      — array of ASCII strings, one per frame (empty before first render)
 *   renderMs    — milliseconds for the last conversion batch (null until first)
 *   isComputing — true while a conversion is in-flight
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

  // Spawn the worker on mount, terminate on unmount.
  useEffect(() => {
    const worker = new Worker(
      new URL('./ascii-worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (evt: MessageEvent<WorkerResponse>) => {
      const { id, ascii, renderMs: ms } = evt.data;
      // Discard stale responses from superseded requests
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

  // Re-run whenever file or opts change (debounced 120ms).
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

      const isEdges = opts.outputMode === 'edges' || opts.mode === 'edges';
      const coreOpts = {
        width: opts.width,
        ramp: rampArg,
        invert: opts.invert,
        output: (opts.outputMode === 'color' ? 'html' : 'plain') as 'html' | 'plain',
        mode: (isEdges ? 'edges' : 'brightness') as 'edges' | 'brightness',
      };

      // Apply contrast adjustment to each frame's RGBA before sending to worker.
      const workerFrames = file.frames.map((f) => {
        const adjusted = applyContrast(f.image.data, opts.contrast);
        return {
          rgba: new Uint8ClampedArray(adjusted),
          width: f.image.width,
          height: f.image.height,
        };
      });

      const id = ++requestIdRef.current;
      const request: WorkerRequest = { id, frames: workerFrames, opts: coreOpts };
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
    opts.contrast,
    opts.outputMode,
    opts.mode,
    opts.nonce,
  ]);

  return { frames, renderMs, isComputing };
}
