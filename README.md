# ASCII-art-generator

An ASCII art generator from uploaded images. Will ship as both a CLI (npm) and a web app (Vercel) — built end-to-end at **$0 cost**.

## Status

Greenfield. See the planning docs below.

## Docs

- **[Phase Plan](docs/phases.md)** — five-phase roadmap from core engine to portfolio polish
- **[Architecture](docs/architecture.md)** — how the pure core decouples from platform-specific image loading
- **[Tech Stack](docs/tech-stack.md)** — every dependency and why, with the $0 audit

## Planned phases

1. **Core engine** — pure TS function: pixels → ASCII string
2. **CLI wrapper** — `npx ascii-art photo.jpg`, published to npm
3. **Web interface** — drag-and-drop, live preview, deployed to Vercel
4. **Advanced** — colored HTML output, Sobel edge detection, animated GIFs
5. **Polish** — gallery, blog post, OG cards, Lighthouse 95+
