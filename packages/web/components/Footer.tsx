import type { JSX } from "react";

const MARQUEE_ITEMS = [
  "made with love and Math.floor()",
  "no images leave your browser",
  "open source on GitHub",
  "v0.4.2 — last cooked 02/14",
  "made with love and Math.floor()",
  "no images leave your browser",
  "open source on GitHub",
];

export function Footer(): JSX.Element {
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
        you are visitor <span className="lcd">#00042</span>
      </div>
    </footer>
  );
}
