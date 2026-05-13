import type { JSX } from "react";
import Link from "next/link";

type TopbarActive = "convert" | "gallery" | "how-it-works";

type TopbarProps = {
  compact?: boolean;
  active?: TopbarActive;
};

export function Topbar({ compact = false, active }: TopbarProps): JSX.Element {
  const cls = (key: TopbarActive) => (active === key ? "active" : undefined);
  return (
    <header className="topbar">
      <div className="wordmark">
        ASCII<span className="dot">.</span>ART
        <span className="cursor-block" aria-hidden="true" />
      </div>
      {!compact && (
        <nav className="nav">
          <Link href="/" className={cls("convert")}>Convert</Link>
          <Link href="/gallery" className={cls("gallery")}>Gallery</Link>
          <Link href="/how-it-works" className={cls("how-it-works")}>How it works</Link>
          <a
            href="https://github.com/AlesSystems/ASCII-art-generator"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      )}
      <span className="badge-pill">
        <span className="star">★</span> best viewed in any browser ;)
      </span>
    </header>
  );
}
