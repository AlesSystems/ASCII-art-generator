import type { JSX } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Gallery — ASCII.ART",
  description: "A showcase of ASCII art created with ASCII.ART. Coming soon.",
};

export default function GalleryPage(): JSX.Element {
  return (
    <div className="frame">
      <Topbar active="gallery" />
      <main className="static-main">
        <div className="static-card">
          <div className="static-tag">
            <span className="dot" aria-hidden="true" />
            UNDER CONSTRUCTION
          </div>
          <h1 className="static-h1">Gallery</h1>
          <p className="static-lead">
            A curated showcase of community ASCII art is on the way. We&apos;re
            cooking up a space for the best conversions, weirdest experiments,
            and happy accidents. For now, the converter itself is the show.
          </p>
          <div className="static-cta">
            <Link href="/" className="btn primary">← back to converter</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
