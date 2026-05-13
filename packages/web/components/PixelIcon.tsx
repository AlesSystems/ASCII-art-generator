import type { JSX } from "react";

export function PixelIcon(): JSX.Element {
  return (
    <svg
      className="dz-icon"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <rect x="2" y="4" width="20" height="16" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
      <rect x="4" y="6" width="3" height="3" fill="#FF5B5B" />
      <path d="M3 18 L9 12 L13 16 L16 13 L21 18 L21 19 L3 19 Z" fill="#1A1A1A" />
    </svg>
  );
}
