"use client";

import type { JSX } from "react";
import { ASCII_CAT } from "@/components/placeholder-ascii";

type PreviewPaneProps = {
  ascii: string;
  charWidth: number;
  charHeight: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRerender: () => void;
  frame: { current: number; total: number };
  showPlaceholder: boolean;
};

export function PreviewPane({
  ascii,
  charWidth,
  charHeight,
  zoom,
  onZoomIn,
  onZoomOut,
  onRerender,
  frame,
  showPlaceholder,
}: PreviewPaneProps): JSX.Element {
  const displayAscii = ascii || (showPlaceholder ? ASCII_CAT : "");
  const currentStr = String(frame.current).padStart(2, "0");
  const totalStr = String(frame.total).padStart(2, "0");

  return (
    <section className="preview-pane">
      <div className="preview-toolbar">
        <div className="tool-group">
          <button type="button" className="tool-btn" aria-label="Zoom out" onClick={onZoomOut}>
            −
          </button>
          <div className="zoom-val">{zoom}%</div>
          <button type="button" className="tool-btn" aria-label="Zoom in" onClick={onZoomIn}>
            +
          </button>
        </div>
        <div className="frame-counter">
          frame <strong>{currentStr}</strong> / <strong>{totalStr}</strong>
        </div>
        <button type="button" className="re-render" onClick={onRerender}>
          ↻ re-render
        </button>
      </div>

      <div className="preview-card">
        <div className="corner-tag">
          <span className="dot" />
          RENDER · {charWidth} × {charHeight}
        </div>
        <div className="dither-corner tr" />
        <div className="dither-corner bl" />
        <pre
          className="ascii-out"
          style={{ ["--ascii-zoom" as string]: zoom / 100 }}
        >
          {displayAscii}
        </pre>
        <div
          className="sticker"
          style={{ bottom: 16, right: 18, transform: "rotate(3deg)" }}
        >
          NEW! v0.4
        </div>
      </div>
    </section>
  );
}
