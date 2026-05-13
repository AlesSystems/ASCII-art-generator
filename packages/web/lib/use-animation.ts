'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives an animation loop over N frames with per-frame delays.
 *
 * Uses requestAnimationFrame to advance frames; pauses when isPlaying=false.
 * When frameCount === 1, currentFrame stays at 0 (no animation).
 *
 * @param frameCount  Total number of frames (>= 1)
 * @param delaysMs    Per-frame delay in ms (length must equal frameCount)
 * @param isPlaying   Whether the animation is running
 * @returns { currentFrame, reset }
 */
export function useAnimation(
  frameCount: number,
  delaysMs: number[],
  isPlaying: boolean
): { currentFrame: number; reset: () => void } {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Refs so the RAF callback can read latest values without re-subscribing
  const frameCountRef = useRef(frameCount);
  const delaysMsRef = useRef(delaysMs);
  const isPlayingRef = useRef(isPlaying);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const frameStartTimeRef = useRef<number | null>(null);

  frameCountRef.current = frameCount;
  delaysMsRef.current = delaysMs;
  isPlayingRef.current = isPlaying;

  // Jump back to frame 0 when frameCount changes (new file loaded)
  useEffect(() => {
    currentFrameRef.current = 0;
    setCurrentFrame(0);
    frameStartTimeRef.current = null;
  }, [frameCount]);

  useEffect(() => {
    if (frameCount <= 1) {
      // Static image — no animation needed
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    if (!isPlaying) {
      // Pause — cancel the loop
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      frameStartTimeRef.current = null;
      return;
    }

    // Playing — start/resume the RAF loop
    const tick = (now: number) => {
      if (!isPlayingRef.current) return;

      if (frameStartTimeRef.current === null) {
        frameStartTimeRef.current = now;
      }

      const elapsed = now - frameStartTimeRef.current;
      const delay = delaysMsRef.current[currentFrameRef.current] ?? 100;

      if (elapsed >= delay) {
        const next = (currentFrameRef.current + 1) % frameCountRef.current;
        currentFrameRef.current = next;
        setCurrentFrame(next);
        frameStartTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [frameCount, isPlaying]);

  const reset = useCallback(() => {
    currentFrameRef.current = 0;
    setCurrentFrame(0);
    frameStartTimeRef.current = null;
  }, []);

  return { currentFrame, reset };
}
