import type { JSX } from "react";

export function MobileStatusBar(): JSX.Element {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="status-icons">
        {/* Signal */}
        <svg width="17" height="11" viewBox="0 0 17 11">
          <g fill="#1A1A1A">
            <rect x="0" y="7" width="3" height="4" />
            <rect x="4" y="5" width="3" height="6" />
            <rect x="8" y="3" width="3" height="8" />
            <rect x="12" y="0" width="3" height="11" />
          </g>
        </svg>
        {/* Wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="#1A1A1A">
          <path d="M8 11l2-2.5c-1.2-1-2.8-1-4 0L8 11zM3 6.5l1.5 1.8C6.4 6.4 9.6 6.4 11.5 8.3L13 6.5C9.9 3.6 6.1 3.6 3 6.5zM0 3.5l1.5 1.8C5 1.9 11 1.9 14.5 5.3L16 3.5C11.5-1 4.5-1 0 3.5z" />
        </svg>
        {/* Battery */}
        <svg width="27" height="11" viewBox="0 0 27 11" fill="none">
          <rect x="0.5" y="0.5" width="22" height="10" rx="2" stroke="#1A1A1A" />
          <rect x="2" y="2" width="19" height="7" rx="1" fill="#1A1A1A" />
          <rect x="24" y="3" width="2" height="5" rx="1" fill="#1A1A1A" />
        </svg>
      </div>
    </div>
  );
}
