"use client";

import type { JSX } from "react";
import { ASCII_CAT } from "@/components/placeholder-ascii";

type PreviewPaneProps = {
  ascii: string;
  charWidth: number;
  charHeight: number;
  onRerender: () => void;
  frame: { current: number; total: number };
  showPlaceholder: boolean;
  isHtml?: boolean;
  /** Whether to show the play/pause button (only for animated GIFs) */
  showPlayButton?: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  isComputing?: boolean;
};

export function PreviewPane({
  ascii,
  charWidth,
  charHeight,
  onRerender,
  frame,
  showPlaceholder,
  isHtml = false,
  showPlayButton = false,
  isPlaying = true,
  onPlayPause,
  isComputing = false,
}: PreviewPaneProps): JSX.Element {
  const displayAscii = ascii || (showPlaceholder ? ASCII_CAT : "");
  const currentStr = String(frame.current).padStart(2, "0");
  const totalStr = String(frame.total).padStart(2, "0");

  return (
    <section className="preview-pane">
      <div className="preview-toolbar">
        <div className="frame-counter">
          frame <strong>{currentStr}</strong> / <strong>{totalStr}</strong>
        </div>
        {showPlayButton && onPlayPause && (
          <button
            type="button"
            className="play-btn"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        )}
        <button
          type="button"
          className="re-render"
          onClick={onRerender}
          disabled={isComputing || !ascii}
          aria-label="Re-render ASCII output"
          title="Re-render"
        >
          <span className={`re-render-icon${isComputing ? " spinning" : ""}`}>↻</span>
          re-render
        </button>
      </div>

      <div className="preview-card">
        <div className="corner-tag">
          <span className="dot" />
          RENDER · {charWidth} × {charHeight}
        </div>
        <div className="dither-corner tr" />
        <div className="dither-corner bl" />
        {isHtml ? (
          <pre
            className="ascii-out"
            dangerouslySetInnerHTML={{ __html: displayAscii }}
          />
        ) : (
          <pre className="ascii-out">{displayAscii}</pre>
        )}
        <div
          className="sticker"
          style={{ bottom: 16, right: 18, transform: "rotate(3deg)" }}
        >
          NEW! v1.0
        </div>
      </div>
    </section>
  );
}
