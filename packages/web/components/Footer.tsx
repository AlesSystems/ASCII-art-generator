"use client";

import { useEffect, useState, type JSX } from "react";

const MARQUEE_ITEMS = [
  "made with love and Math.floor()",
  "no images leave your browser",
  "open source on GitHub",
  "v1.0 — last cooked 05/13",
  "made with love and Math.floor()",
  "no images leave your browser",
  "open source on GitHub",
];

const VISITOR_KEY = "ascii-art:visitor-count";
const PLACEHOLDER = "#-----";

function formatCount(n: number): string {
  return "#" + String(n).padStart(5, "0");
}

function readAndIncrement(): number {
  try {
    const raw = window.localStorage.getItem(VISITOR_KEY);
    const prev = raw === null ? 0 : Number.parseInt(raw, 10);
    const next = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
    window.localStorage.setItem(VISITOR_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function Footer(): JSX.Element {
  const [display, setDisplay] = useState<string>(PLACEHOLDER);

  useEffect(() => {
    setDisplay(formatCount(readAndIncrement()));
  }, []);

  return (
    <footer className="footer">
      <div className="marquee">
        <div className="marquee-track">
          {MARQUEE_ITEMS.map((text, i) => (
            <span key={i}>
              <span className="star">★</span>
              {text}
            </span>
          ))}
          <span className="star">★</span>
        </div>
      </div>
      <div className="visitor">
        you are visitor <span className="lcd" aria-live="polite">{display}</span>
      </div>
    </footer>
  );
}
