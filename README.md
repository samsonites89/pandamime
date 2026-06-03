# Pantomime

Pick any color — get the closest named Pantone® fashion colors by perceptual distance.

> **Not affiliated with or endorsed by Pantone LLC. PANTONE® is a registered trademark of Pantone LLC. Color matches are approximate and for reference only — verify against an official Pantone guide before production use.**

---

## What it does

Pantomime is a free, client-side tool for developers and designers. Drop a color (color wheel, hex, or RGB) and get up to 10 perceptually closest named Pantone® fashion colors ranked by ΔE (CIEDE2000). Results include the color name, code, hex value, and a plain-words closeness cue.

All matching runs in the browser — no backend, no API calls, no rate limits.

## Tech stack

- **Next.js 16** (App Router, static export)
- **TypeScript**
- **styled-components** (CSS-in-JS)
- **culori** — CIELAB conversion + CIEDE2000 distance
- **@jaames/iro** — color wheel picker
- **Vitest** — unit tests

## Running locally

```bash
nvm use   # requires Node 24 (see .nvmrc)
npm install
npm run dev
```

## Building for production

```bash
npm run build
# Static output in /out — deploy to Vercel, GitHub Pages, Cloudflare Pages, etc.
```

## Testing

```bash
npm test
```

## Data

The dataset lives at `src/data/named_table_collapsed.json`: ~1,900+ named Pantone® fashion colors (cotton TCX, paper TPG, polyester TSX) with self-sampled hex values. It was produced by `collect_pantone.py` (in `wip/`) — see [docs/METHODOLOGY.md](docs/METHODOLOGY.md) for how the data was collected and what its limitations are.

### Schema

```json
[
  {
    "code": "14-0760 TCX",
    "name": "Cyber Yellow",
    "hex": "#ffd400",
    "materials": ["cotton", "paper"]
  }
]
```

- `code` — Pantone color code (preferred cotton/TCX form when both exist)
- `name` — human-readable color name
- `hex` — self-sampled approximation from the public chip image
- `materials` — which fashion books this color appears in

To rebuild the dataset: `cd wip && python collect_pantone.py --collapse`

## URL state

The current color is encoded as `?c=rrggbb` in the URL, so results are linkable and shareable. No personal data is stored.

## License

MIT
