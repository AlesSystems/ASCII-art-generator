---
name: cli-patterns
description: Use when editing packages/cli/, working with sharp image loading, commander flags, clipboardy, bin/ entry point, or CLI stdout/file/clipboard output patterns.
---

# CLI Patterns (`packages/cli/`)

## Image loading with sharp
```ts
const { data, info } = await sharp(filePath)
  .raw()
  .ensureAlpha()
  .toBuffer({ resolveWithObject: true });
// info: { width, height, channels: 4 }
const rgba = new Uint8ClampedArray(data.buffer);
```
`ensureAlpha()` guarantees 4 channels (RGBA). Cast `Buffer` to `Uint8ClampedArray` for core.

## Commander flags
```ts
program
  .argument('<image>')
  .option('-w, --width <n>',   'output char width', '80')
  .option('-r, --ramp <name>', 'preset or custom ramp string')
  .option('-i, --invert',      'invert brightness')
  .option('-o, --output <path>', 'write to file instead of stdout')
  .option('-c, --clipboard',   'copy result to clipboard');
```

## Bin entry point
`packages/cli/bin/ascii-art.js` — shebang wrapper:
```js
#!/usr/bin/env node
import '../dist/index.js';
```
`package.json`:
```json
{ "bin": { "ascii-art": "bin/ascii-art.js" } }
```
Test locally: `npm link` inside `packages/cli`, then run `ascii-art`.

## Clipboard output
Use `clipboardy` (cross-platform, no native compilation):
```ts
import clipboard from 'clipboardy';
await clipboard.write(asciiResult);
```

## stdout must be CLEAN
Do not log progress, warnings, or debug info to stdout.
Use `process.stderr.write(...)` for any non-output messages.
Stdout is meant to be pipeable: `ascii-art photo.jpg > out.txt`.

## sharp version pinning
Pin exact version in `package.json` (e.g. `"sharp": "0.33.5"`) — prebuilt binaries for arm64 + x64.
If CI fails to install sharp, fall back to `jimp` (pure JS, slower, zero native deps).

## Publish
`npm publish --access public` under a scoped name (free for public packages).
`npx <pkg> photo.jpg` must work after publish — verify the bin field resolves correctly.
