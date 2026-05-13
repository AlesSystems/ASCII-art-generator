---
name: web-ui-patterns
description: Use when editing packages/web/, working with Next.js App Router, canvas getImageData, Tailwind, drag-drop upload, sliders, PreviewPane, Web Worker, or Vercel deployment for this project.
---

# Web UI Patterns (`packages/web/`)

## Stack
Next.js 15 App Router, TypeScript 5, Tailwind CSS. Hosted on Vercel Hobby (free).

## Browser image loading (`lib/canvas-loader.ts`)
```ts
export async function fileToRgba(file: File): Promise<{ rgba: Uint8ClampedArray; width: number; height: number }> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
  return { rgba: data, width, height };
}
```
Pass `rgba` directly to `pixelsToAscii` from `@ascii-art/core`.

## NEVER import sharp in packages/web
`sharp` is Node-only. Importing it in any file under `packages/web/` will crash the Next.js build.
If you see `sharp` in a web import, remove it immediately.

## next.config.js — transpile workspace package
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ascii-art/core'],
};
export default nextConfig;
```

## UI Components (Phase 3)
| Component    | Responsibility |
|-------------|---------------|
| `Uploader`   | Drag-drop zone + `<input type="file">` fallback (required for iPhone Safari) |
| `Controls`   | Width slider (40–200), contrast slider, ramp picker dropdown, invert toggle |
| `PreviewPane`| `<pre>` with monospace font; debounced re-render on every slider change |
| `Actions`    | Copy to clipboard, Download as `.txt` |

## Debouncing
Wrap slider `onChange` with a ~100ms debounce before calling `pixelsToAscii`.
Only move conversion to a Web Worker if slider drag is visibly janky on a mid-range device.

## Mobile
Drag-drop must degrade gracefully to `<input type="file">` on iPhone Safari — no JS-only drag handling.

## Vercel deploy
Connect repo to Vercel Hobby. Set root directory to `packages/web` (or configure `vercel.json`).
Auto-deploys on push to `main`. Public URL: `*.vercel.app`.
No paid add-ons — use free Vercel Analytics tier if tracking is needed.
