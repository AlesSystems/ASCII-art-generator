import type { JSX } from "react";

type TopbarProps = { compact?: boolean };

export function Topbar({ compact = false }: TopbarProps): JSX.Element {
  return (
    <header className="topbar">
      <div className="wordmark">
        ASCII<span className="dot">.</span>ART
        <span className="cursor-block" aria-hidden="true" />
      </div>
      {!compact && (
        <nav className="nav">
          <a href="#" className="active">Convert</a>
          <a href="#">Gallery</a>
          <a href="#">How it works</a>
          <a href="#">GitHub ↗</a>
        </nav>
      )}
      <span className="badge-pill">
        <span className="star">★</span> best viewed in any browser ;)
      </span>
    </header>
  );
}
