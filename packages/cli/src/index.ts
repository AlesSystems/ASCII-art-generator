import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import clipboard from "clipboardy";
import { pixelsToAscii } from "@ascii-art/core";
import { loadImage } from "./load-image.js";
import { buildAnimatedHtml } from "./animated-html.js";

const program = new Command();

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
  .option("-e, --edges", "edge-detection mode (Sobel); compatible with --color")
  .option("-a, --animate", "convert all frames of an animated image to animated HTML (requires --output)")
  .action(async (image: string, opts: {
    width: number;
    ramp: string;
    invert?: boolean;
    output?: string;
    clipboard?: boolean;
    color?: boolean;
    edges?: boolean;
    animate?: boolean;
  }) => {
    try {
      const loaded = await loadImage(image);

      // ── Animated path ──────────────────────────────────────────────────────
      if (loaded.isAnimated && opts.animate) {
        // --animate requires --output (animated HTML is too large for stdout)
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

        const asciiFrames = loaded.frames.map(({ rgba, width, height }) =>
          pixelsToAscii(rgba, width, height, {
            width: opts.width,
            ramp: opts.ramp,
            invert: !!opts.invert,
            output: 'plain',
            mode: opts.edges ? 'edges' : 'brightness',
          })
        );

        const delaysMs = loaded.frames.map((f) => f.delayMs);
        const title = image.replace(/.*[/\\]/, "").replace(/\.[^.]+$/, "");
        const html = buildAnimatedHtml(asciiFrames, delaysMs, title, 'text');
        await writeFile(opts.output, html, "utf8");

        if (opts.clipboard) {
          // Copy first frame only
          await clipboard.write(asciiFrames[0] ?? "");
        }
        return;
      }

      // ── Animated input without --animate: warn and use first frame ──────────
      if (loaded.isAnimated && !opts.animate) {
        process.stderr.write(
          "ascii-art: Input is animated; only first frame converted. Use --animate to convert all frames.\n"
        );
      }

      // ── Single-frame path (or first frame of an animated image) ────────────
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

      const ascii = pixelsToAscii(rgba, width, height, {
        width: opts.width,
        ramp: opts.ramp,
        invert: !!opts.invert,
        output: outputMode,
        mode: opts.edges ? 'edges' : 'brightness',
      });

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
