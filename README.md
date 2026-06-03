<p align="center">
  <img src="public/pandamime.png" alt="Pandamime mascot" width="80" />
</p>

<h1 align="center">PANDAMIME</h1>
<p align="center"><em>find your closest Pantone® colors</em></p>

---

You've got a hex code. You need a Pantone name. You open Pantone's website, hit a paywall, and close the tab. Sound familiar?

**Pandamime** is the free, offline alternative. Drop any color — hex, RGB, or color wheel — and get up to 10 perceptually closest named Pantone® fashion colors, ranked by actual human eye distance (CIEDE2000), not by which RGB number is nearest.

Covers **3,100+ colors** across five Pantone fashion books: cotton (TCX), paper (TPG), polyester (TSX), Nylon Brights (TN), and Metallic Shimmers (TPM).

No account. No paywall. No backend. Everything runs in your browser.

> **Not affiliated with or endorsed by Pantone LLC. PANTONE® is a registered trademark of Pantone LLC. Color matches are approximate and for reference only — verify against an official Pantone guide before production use.**

---

## Why this exists

**Pantone** is the global standard for color communication. If you've ever worked on print, fashion, product design, or brand identity, you've encountered it: a system of 3,100+ named, numbered colors — things like *Cyber Yellow 14-0760 TCX* or *Classic Blue 19-4052 TCX* — each with a precisely defined ink formula that prints the same on a swatch in Tokyo as it does in Toronto.

Pantone colors are everywhere. Brand guidelines specify them. Fabric suppliers quote them. Printer proofs use them. When a designer says "use Pantone 485," everyone in the supply chain knows exactly what red that means.

The problem: looking up which Pantone code is closest to a given screen color requires either an expensive physical fan deck or a subscription to Pantone's digital tools. That's a steep tax for a single "what's the Pantone name for this?" lookup.

Pandamime was built to close that gap — a fast, free, perceptually accurate reference tool for the moments when you just need a name to put in a brief, a spec, or a conversation.

---

## What it does

Drop a color (color wheel, hex, or RGB) and get up to 10 perceptually closest named Pantone® fashion colors ranked by **ΔE (CIEDE2000)** — the industry-standard metric for how different two colors look to the human eye. Results include the color name, code, hex value, and a plain-words closeness cue.

Covers **3,100+ colors** across five Pantone fashion books: cotton (TCX), paper (TPG), polyester (TSX), Nylon Brights (TN), and Metallic Shimmers (TPM).

All matching runs in the browser — no backend, no API calls, no rate limits.

---

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

The dataset lives at `src/data/named_table_collapsed.json`: 3,100+ named Pantone® fashion colors (cotton TCX, paper TPG, polyester TSX, Nylon Brights TN, Metallic Shimmers TPM) with self-sampled hex values. It was produced by `scripts/collect_pantone.py` — see [docs/METHODOLOGY.md](docs/METHODOLOGY.md) for how the data was collected and what its limitations are.

> **Why not all Pantone colors?** The collection script discovers colors by querying Pantone's color-finder with hex values sampled across the RGB cube. It only retains colors that have a human-readable name (e.g. *Cyber Yellow*, *Classic Blue*). Unnamed numeric-only entries — which exist in some books — are intentionally excluded, since a nameless code is not useful as a reference for designers or vendors.

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

To rebuild the dataset: `python scripts/collect_pantone.py all --collapse`

## URL state

The current color is encoded as `?c=rrggbb` in the URL, so results are linkable and shareable. No personal data is stored.

## License

MIT
