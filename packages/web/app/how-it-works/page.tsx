import type { JSX } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "How it works — ASCII.ART",
  description: "The pixel-to-character pipeline behind ASCII.ART: grayscale, downsample, ramp mapping, edges, color, and animated GIFs.",
};

export default function HowItWorksPage(): JSX.Element {
  return (
    <div className="frame">
      <Topbar active="how-it-works" />
      <main className="static-main">
        <div className="static-card hiw-card">
          <div className="static-tag">
            <span className="dot" aria-hidden="true" />
            THE PIPELINE
          </div>
          <h1 className="static-h1">How it works</h1>
          <p className="static-lead">
            ASCII.ART is a pure-function image-to-text converter. Every pixel
            stays in your browser — no uploads, no servers, no nonsense.
            Here&apos;s what happens between your image and the characters on
            screen.
          </p>

          <section className="hiw-step">
            <div className="section-label">01 / Grayscale</div>
            <p>
              Each pixel is collapsed to a single brightness value using the
              Rec. 709 luminance formula. This weights green more than red and
              red more than blue — closer to how the human eye reads light.
            </p>
            <pre className="hiw-formula">Y = 0.2126·R + 0.7152·G + 0.0722·B</pre>
          </section>

          <section className="hiw-step">
            <div className="section-label">02 / Downsample</div>
            <p>
              The grayscale image is averaged down to the target character
              width using a box filter. There&apos;s a <strong>0.5 vertical
              correction</strong> in here, because terminal characters are about
              twice as tall as they are wide. Skip the correction and your cat
              ends up squashed.
            </p>
          </section>

          <section className="hiw-step">
            <div className="section-label">03 / Ramp mapping</div>
            <p>
              Each averaged brightness picks a character from a ramp string —
              dark to light. The default ramp is:
            </p>
            <pre className="hiw-formula">{`" .:-=+*#%@"`}</pre>
            <p>
              Use the <em>Charset</em> picker in the converter to swap in your
              own — short ramps give chunkier, more abstract output.
            </p>
          </section>

          <section className="hiw-step">
            <div className="section-label">04 / Edge mode (optional)</div>
            <p>
              Switch the output mode to <strong>Edges</strong> and the ramp
              lookup is replaced with a Sobel gradient. Horizontal-ish edges
              become <code>-</code>, vertical-ish edges become <code>|</code>,
              and diagonals become <code>/</code> or <code>{"\\"}</code>. Great for
              line-art and high-contrast subjects.
            </p>
          </section>

          <section className="hiw-step">
            <div className="section-label">05 / Color & animated GIFs</div>
            <p>
              In <strong>Color</strong> mode, each character is wrapped in a
              span carrying the original pixel&apos;s color — exportable as
              standalone HTML. Drop in a <code>.gif</code> and the converter
              decodes every frame (via gifuct-js, respecting per-frame delays
              and disposal), plays it live in the preview, and lets you export
              a self-contained <em>animated HTML</em> file — no external
              dependencies, just an embedded frame array and a tiny loop.
            </p>
            <div className="static-cta">
              <Link href="/" className="btn primary">try it with a GIF →</Link>
            </div>
          </section>

          <section className="hiw-step hiw-privacy">
            <div className="section-label">Privacy</div>
            <p>
              Everything runs in your browser. Images are decoded with the
              Canvas API and converted in a Web Worker. Nothing is uploaded,
              logged, or persisted anywhere.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
