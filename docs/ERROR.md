# Error Log

Every error encountered while implementing this project — whether by a human or an agent — is appended below using the `ERR-XXXX` template. Entries are append-only; never delete past entries. Update the index table when adding a new entry.

## Index

| ID | Phase | Component | One-line summary |
|----|-------|-----------|------------------|
| ERR-0001 | 4c | @ascii-art/cli (tests) | Hand-crafted animated GIF fixture had invalid LZW data — libvips rejected it with "gifload: Invalid frame data". |

## Template

```
### ERR-XXXX — short title

- **Phase**: 1 / 2 / 3 / 4 / 5
- **Component**: e.g. @ascii-art/core, @ascii-art/cli, @ascii-art/web
- **Date**: YYYY-MM-DD
- **Root cause** (one sentence):
- **Generalized rule that prevents this class of error**:
- **Fix**:
```

---

_Phase 3 implementation produced no errors that required logging. This file is initialised here so future incidents have a place to land._

### ERR-0001 — Animated GIF fixture had invalid LZW data

- **Phase**: 4c
- **Component**: @ascii-art/cli (tests/gif-load.test.ts)
- **Date**: 2026-05-13
- **Root cause** (one sentence): The hand-crafted 4×4 2-frame GIF fixture's LZW image data bytes did not decode to valid codes under libvips' `gifload`, so `sharp(buf, { animated: true }).raw()` failed with `gifload: Invalid frame data` and broke `loadImage` on CI.
- **Generalized rule that prevents this class of error**: Never trust a hand-rolled compressed byte stream just because a comment says "verified" — for binary test fixtures, either (a) commit a real file produced by a known-good encoder, or (b) construct the bytes with an encoding scheme simple enough to verify by inspection (e.g., GIF LZW using a `clear-before-every-literal` pattern that keeps every code at `minCodeSize + 1` bits and never grows the dictionary).
- **Fix**: Replaced the LZW bytes with a clear-before-every-literal encoding: 16 `(Clear=4, Literal=N)` pairs + `EOI=5`, packed LSB-first into 3-bit codes — yielding the repeating byte pattern `[0x04, 0x41, 0x10] × 4 + 0x05` for frame 0 (red) and `[0x0C, 0xC3, 0x30] × 4 + 0x05` for frame 1 (blue). Verified end-to-end against `sharp` 0.33.5 / libvips 8.15.3.
