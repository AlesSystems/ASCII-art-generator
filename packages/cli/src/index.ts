import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import clipboard from "clipboardy";
import { pixelsToAscii, computeFrameStats } from "@ascii-art/core";
import type { PixelsToAsciiOpts, ContrastStats, AsciiMode } from "@ascii-art/core";
import { loadImage } from "./load-image.js";
import { buildAnimatedHtml } from "./animated-html.js";

const program = new Command();

type CliOpts = {
  width: number;
  ramp: string;
  invert?: boolean;
  output?: string;
  clipboard?: boolean;
  color?: boolean;
  edges?: boolean;
  animate?: boolean;
  mode?: string;
  gamma: boolean;          // commander negates --no-gamma → gamma:false
  autoContrast: boolean;   // commander negates --no-auto-contrast
  dither?: boolean;
  brightness: number;
  edgeThreshold: number;
  legacy?: boolean;
};

function resolveMode(opts: CliOpts): AsciiMode {
  if (opts.mode === 'edges' || opts.mode === 'brightness' || opts.mode === 'hybrid') {
    return opts.mode;
  }
  if (opts.edges) return 'edges';
  return 'brightness';
}

function buildCoreOpts(opts: CliOpts, frameStats?: ContrastStats): PixelsToAsciiOpts {
  const legacy = opts.legacy ?? false;
  return {
    width: opts.width,
    ramp: opts.ramp,
    invert: !!opts.invert,
    mode: resolveMode(opts),
    gamma: legacy ? false : opts.gamma,
    autoContrast: legacy ? false : opts.autoContrast,
    dither: legacy ? false : !!opts.dither,
    brightness: opts.brightness,
    edgeThreshold: opts.edgeThreshold,
    frameStats,
  };
}

program
  .name("ascii-art")
  .description("Convert an image to ASCII art")
  .argument("<image>", "path to an image file")
  .option("-w, --width <n>", "target character width", (v) => parseInt(v, 10), 80)
  .option("-r, --ramp <preset|string>", "ramp name or raw string", "default")
  .option("-i, --invert", "invert the ramp")
  .option("-o, --output <path>", "write to file instead of stdout")
  .option("-c, --clipboard", "copy result to clipboard (suppresses stdout)")
  .option("-C, --color", "colorize output using ANSI truecolor escapes")
  .option("-e, --edges", "shortcut for --mode edges (kept for backwards compat)")
  .option("-m, --mode <mode>", "brightness | edges | hybrid", "brightness")
  .option("-a, --animate", "convert all frames of an animated image to animated HTML (requires --output)")
  .option("--no-gamma", "disable gamma-correct luminance (uses naive sRGB byte weighting)")
  .option("--no-auto-contrast", "disable percentile auto-contrast")
  .option("--dither", "Floyd–Steinberg dithering for smoother gradients")
  .option("-b, --brightness <n>", "brightness offset, -100..100", (v) => parseInt(v, 10), 0)
  .option("--edge-threshold <n>", "Sobel threshold on a normalized 0..255 scale", (v) => parseInt(v, 10), 30)
  .option("--legacy", "byte-identical pre-v2 output (disables gamma, auto-contrast, dither)")
  .action(async (image: string, opts: CliOpts) => {
    try {
      const loaded = await loadImage(image);

      // ── Animated path ──────────────────────────────────────────────────────
      if (loaded.isAnimated && opts.animate) {
        if (!opts.output) {
          process.stderr.write(
            "ascii-art: --animate requires --output. Animated HTML is too large for stdout.\n"
          );
          process.exit(1);
        }

        if (opts.clipboard) {
          process.stderr.write(
            "ascii-art: --clipboard with --animate is not supported; copying first frame only.\n"
          );
        }

        // Compute combined frameStats across every frame so auto-contrast
        // stretches the whole animation against one window → no flicker.
        const useAutoContrast = !(opts.legacy ?? false) && opts.autoContrast;
        let combinedStats: ContrastStats | undefined;
        if (useAutoContrast) {
          let lo = 255, hi = 0;
          for (const f of loaded.frames) {
            const s = computeFrameStats(f.rgba, f.width, f.height, {
              width: opts.width,
              gamma: opts.legacy ? false : opts.gamma,
            });
            if (s.lo < lo) lo = s.lo;
            if (s.hi > hi) hi = s.hi;
          }
          combinedStats = hi > lo ? { lo, hi } : { lo: 0, hi: 255 };
        }

        const coreOpts = buildCoreOpts(opts, combinedStats);
        const asciiFrames = loaded.frames.map(({ rgba, width, height }) =>
          pixelsToAscii(rgba, width, height, { ...coreOpts, output: 'plain' })
        );

        const delaysMs = loaded.frames.map((f) => f.delayMs);
        const title = image.replace(/.*[/\\]/, "").replace(/\.[^.]+$/, "");
        const html = buildAnimatedHtml(asciiFrames, delaysMs, title, 'text');
        await writeFile(opts.output, html, "utf8");

        if (opts.clipboard) {
          await clipboard.write(asciiFrames[0] ?? "");
        }
        return;
      }

      if (loaded.isAnimated && !opts.animate) {
        process.stderr.write(
          "ascii-art: Input is animated; only first frame converted. Use --animate to convert all frames.\n"
        );
      }

      // ── Single-frame path ────────────────────────────────────────────────
      const frame = loaded.frames[0]!;
      const { rgba, width, height } = frame;

      let outputMode: 'plain' | 'ansi' = 'plain';
      if (opts.color) {
        if (opts.output || opts.clipboard) {
          process.stderr.write("ascii-art: --color ignored when writing to file/clipboard\n");
        } else {
          outputMode = 'ansi';
        }
      }

      const coreOpts = buildCoreOpts(opts);
      const ascii = pixelsToAscii(rgba, width, height, { ...coreOpts, output: outputMode });

      if (opts.output) {
        await writeFile(opts.output, ascii, "utf8");
      }

      if (opts.clipboard) {
        await clipboard.write(ascii);
      } else if (!opts.output) {
        process.stdout.write(ascii + "\n");
      }
    } catch (err) {
      process.stderr.write(`ascii-art: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

await program.parseAsync(process.argv);
