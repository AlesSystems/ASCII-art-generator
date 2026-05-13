"use client";

import type { JSX } from "react";

type FileRowProps = {
  name: string;
  size: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  onRemove: () => void;
};

function formatKB(bytes: number): number {
  return Math.round(bytes / 1024);
}

export function FileRow({
  name,
  size,
  width,
  height,
  thumbnailUrl,
  onRemove,
}: FileRowProps): JSX.Element {
  return (
    <div className="file-row">
      <div className="thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div className="file-meta">
        <div className="file-name">{name}</div>
        <div className="file-size">
          {width}×{height} · {formatKB(size)} KB
        </div>
      </div>
      <button
        type="button"
        className="x-btn"
        aria-label="Remove image"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}
