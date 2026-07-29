# NoBlur

Post TikTok videos without the blur. All processing happens in your browser — no data ever leaves your machine.

![Preview](preview.webp)

---

## How It Works

Two modes:

### 1. Inflate (Non-Interpolation) — Fast, 100% original quality

Main mode. No ffmpeg involved — directly manipulates MP4 file structure. What it does:
- **10x** sample table inflation — TikTok sees high-density video, skips aggressive recompression
- **100% original quality** — zero re-encode
- **10-100x faster** than transcoding

Technical:
- Reorders MP4 boxes (moov moved before mdat, ftyp rewritten to `isom`)
- Sample table inflated 10x: stts/stsz/stco/stsc patched, small dummy samples (8-16 bytes per codec) appended at EOF
- Codec-aware dummy sizes:
  - H.264 (avc1/avc3): **8 bytes**
  - H.265/HEVC (hvc1/hev1): **16 bytes**
  - VP9 (vp09): **4 bytes**
  - AV1 (av01): **4 bytes**
  - MPEG-4 Visual (mp4v): **8 bytes**
- Supports VFR, 64-bit chunk offsets (co64), MOV input

### 2. VFI (Interpolation) — 60fps + Inflate

Uses ffmpeg.wasm to interpolate frames to 60fps first, then inflate.

Pipeline:
1. Lazy-load ffmpeg.wasm (only when this mode is on)
2. Filter: `mpdecimate,minterpolate=fps=60:mi_mode=mci:me_mode=$MODE:me=epzs:search_param=4:scd=none`
   - Motion estimation mode: **bilat** (desktop) / **bidir** (mobile)
3. Scale to chosen resolution (720/**1080**/1440)
   - If 1440 picked: VFI processes at 1080 first, then upscales to 1440 using lanczos
4. Encode with libx264, **CRF 20**, **preset ultrafast** (speed > quality)
5. Audio copied directly (`-c:a copy`) — no re-encode
6. Then passes through the same 10x inflate pipeline

Settings:
- Output resolution: **720p, 1080p, or 1440p (2K)**
- Multi-thread if browser supports SharedArrayBuffer (HTTPS + COOP/COEP required)
  - Threads auto: `max(1, floor(hardwareConcurrency / 2))`
- Single-thread fallback if SAB unavailable (localhost or non-secure context)
  - Shows warning: "Enable HTTPS/cross-origin isolation for faster processing"
- FFmpeg instance terminated after each video

---

## Features

| Feature | Detail |
|---|---|
| **100% client-side** | No upload. Private. |
| **Supported files** | MP4 + MOV. Codecs: H.264, H.265/HEVC, VP9, AV1 |
| **Bulk queue** | Drag/drop multiple files, processed sequentially |
| **Multi-thread** | Uses SharedArrayBuffer + COOP/COEP |
| **Single-thread fallback** | Works without SAB — just slower |
| **Screen Wake Lock** | Keeps display awake during processing |
| **History** | IndexedDB — click to re-download anytime |
| **Thumbnail** | Captures frame at 0.1s (JPEG, max 120px) |
| **Mobile responsive** | Layout adapts below 900px |
| **Status log + copy** | Log output is copyable |
| **Cancel button** | Stop processing anytime |
| **TikTok Studio shortcut** | One-click redirect to TikTok Studio |

### Timings

| Constant | Value |
|---|---|
| Frame capture timeout | 5000ms |
| Metadata timeout | 10000ms |
| Progress fade duration | 400ms |
| Batch interval | 600ms between videos |

---

## File Structure

```
NoBlur/
├── ffmpeg-core/            # Single-thread FFmpeg WASM
├── ffmpeg-core-mt/         # Multi-thread FFmpeg WASM (needs SAB)
├── ffmpeg-worker/          # FFmpeg.wasm class worker
├── scripts/
│   └── generate-changelog.mjs
├── src/
│   ├── mp4-boxes.mjs       # MP4 atom parser + codec helpers
│   ├── mp4-inflate.mjs     # Sample table inflation logic
│   ├── mp4-normalize.mjs   # Container normalization (moov→mdat, ftyp)
│   ├── changelog.mjs       # In-app changelog panel
│   ├── changelog-data.mjs  # Changelog entries
│   └── changelog.test.mjs  # Unit tests
├── test/
│   ├── fixtures/           # Real video files for testing
│   ├── generate-fixtures.mjs
│   └── pipeline.test.mjs   # Round-trip pipeline tests
├── index.html
├── style.css               # Neo-brutalist dark UI
├── app.js                  # Main app logic
├── db.js                   # IndexedDB wrapper
├── coi-serviceworker.js    # Cross-origin isolation
├── vite.config.js
├── package.json
├── biome.json
└── README.md
```

---

## Disclaimer

This tool rewrites MP4 container metadata using sample table inflation to bypass platform recompression. **No video/audio data is re-encoded** in the main pipeline — 100% original quality preserved. The VFI path (optional) only does frame rate conversion. Always keep backups of your original video files before processing.
