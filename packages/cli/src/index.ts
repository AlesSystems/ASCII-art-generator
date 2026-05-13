import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import clipboard from "clipboardy";
import { pixelsToAscii } from "@ascii-art/core";
import { loadImage } from "./load-image.js";

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
  .action(async (image: string, opts: {
    width: number;
    ramp: string;
    invert?: boolean;
    output?: string;
    clipboard?: boolean;
  }) => {
    try {
      const { rgba, width, height } = await loadImage(image);
      const ascii = pixelsToAscii(rgba, width, height, {
        width: opts.width,
        ramp: opts.ramp,
        invert: !!opts.invert,
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
