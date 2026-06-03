# How Pandamime Works

## Dataset provenance

The color data was collected from publicly visible Pantone® color chip images — not from official Pantone data or APIs.

**Phase 1 (code collection):** A Python script (`wip/collect_pantone.py`) swept the RGB cube in steps and queried Pantone's color-finder for each sampled point, collecting the named colors that came back from three fashion books: cotton (TCX), paper (TPG), and polyester (TSX).

**Phase 2 (hex sampling):** For each named color, the script downloaded the corresponding `.webp` chip image, flattened any transparency onto white, cropped to the center 60% of the image, and took the median pixel value as the hex approximation.

**Collapsing:** Cotton (TCX) and paper (TPG) share a numbering system, so entries with the same base code are merged into one record. The TCX code and hex are preferred when both exist. Polyester (TSX) codes are kept separate. The result is `named_table_collapsed.json` — the file used for matching.

**What this means for accuracy:** The hex values are screen-sampled approximations of printed color chips, photographed and compressed. They are not measured from physical ink samples and will differ from what you'd get with a spectrophotometer. Use them as a starting point, not a production specification.

## Matching algorithm

1. The user's input (hex or RGB) and every color in the dataset are converted from sRGB into **CIELAB** (also called L\*a\*b\*), a color space designed to approximate human perceptual distance.

2. Pandamime computes the **CIEDE2000 (ΔE)** distance between the user's color and every dataset color. CIEDE2000 is the current industry standard for perceptual color difference — it accounts for known non-uniformities in human vision that simpler metrics like Euclidean RGB or even CIE76 miss.

3. Results are ranked ascending by ΔE and the top N are returned.

This is done entirely in the browser using [culori](https://culorijs.org), a well-tested color math library. The dataset Lab values are precomputed once at module load, so each search is a linear sweep with no repeated conversions.

## Why not use RGB distance?

Two colors can be numerically close in RGB yet look very different to a human eye, and vice versa. For example, two near-identical grays can have very different L\*a\*b\* values depending on their chroma. Lab + CIEDE2000 measures what your eye perceives, not what the numbers say.

## ΔE interpretation

| ΔE | What it means |
|----|---------------|
| < 2 | Very close — difference imperceptible to most eyes |
| 2–5 | Close — noticeable only on direct side-by-side comparison |
| 5–10 | Loose — clearly different colors |
| > 10 | Nearest available — no perceptually close match in the dataset |

## Screen vs. print

Pantone® colors are physical standardized inks. What you see on a monitor is an RGB approximation that varies by display model, calibration, color profile, and ambient lighting. No software tool can give you a print-accurate match. Always verify results against a physical Pantone swatch guide before production use.

## Legal

Not affiliated with or endorsed by Pantone LLC. PANTONE® is a registered trademark of Pantone LLC. Color matches are approximate and for reference only — verify against an official Pantone guide before production use.
