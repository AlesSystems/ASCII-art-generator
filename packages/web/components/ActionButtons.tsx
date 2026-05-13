"use client";

import type { JSX } from "react";

type ActionButtonsProps = {
  onCopy: () => void;
  onDownloadTxt: () => void;
  onDownloadHtml: () => void;
  renderMs: number | null;
  /** If true, show the "Download animated HTML" button */
  isAnimated?: boolean;
  onDownloadAnimatedHtml?: () => void;
};

export function ActionButtons({
  onCopy,
  onDownloadTxt,
  onDownloadHtml,
  renderMs,
  isAnimated = false,
  onDownloadAnimatedHtml,
}: ActionButtonsProps): JSX.Element {
  return (
    <div>
      <div className="btn-stack">
        <button type="button" className="btn primary" onClick={onCopy}>
          <span>Copy to clipboard</span>
          <span
            className="kbd"
            style={{ borderColor: "#fff", background: "transparent", color: "#fff" }}
          >
            ⌘C
          </span>
        </button>
        <button type="button" className="btn" onClick={onDownloadTxt}>
          Download .txt
        </button>
        <button type="button" className="btn" onClick={onDownloadHtml}>
          Download .html
        </button>
        {isAnimated && onDownloadAnimatedHtml && (
          <button type="button" className="btn" onClick={onDownloadAnimatedHtml}>
            Download animated HTML
          </button>
        )}
      </div>
      <div
        style={{
          fontFamily: "VT323, monospace",
          fontSize: 13,
          color: "var(--muted)",
          textAlign: "center",
          marginTop: 8,
          letterSpacing: "0.04em",
        }}
      >
        rendered in{" "}
        <span
          style={{ color: "var(--ink)", fontFamily: "JetBrains Mono", fontSize: 11 }}
        >
          {renderMs !== null ? `${renderMs}ms` : "—"}
        </span>{" "}
        · all local
      </div>
    </div>
  );
}
