"use client";

// Pixel art pandamime panda: white face, black eye patches (the face paint), red suspenders.
// Built as a grid of <rect> elements — no external assets.
//
// Color key:
//   E = "#3d3d3d"  dark gray — ears & body outline, intentionally lighter than
//                  the #0a0a0a page background so they're visible
//   W = "#f0ede6"  off-white face & body
//   P = "#222222"  very dark — eye patches and nose (contrast against W)
//   R = "#cc2222"  red suspenders (matches accent color)

const COLS = 16;
const ROWS = 20;
const SCALE = 4;

type Px = "_" | "E" | "W" | "P" | "R";

// Every row is exactly COLS wide.
// Symmetry axis: 7.5 (between cols 7 and 8).
const SPRITE: Px[][] = [
  // Row 0 — ear tops (cols 3-4 left, 11-12 right)
  ["_","_","_","E","E","_","_","_","_","_","_","E","E","_","_","_"],
  // Row 1 — ears full (cols 2-5 left, 10-13 right)
  ["_","_","E","E","E","E","_","_","_","_","E","E","E","E","_","_"],
  // Row 2 — ear bases; white head fills the center gap
  ["_","_","E","E","E","W","W","W","W","W","W","E","E","E","_","_"],
  // Row 3 — head top
  ["_","W","W","W","W","W","W","W","W","W","W","W","W","W","W","_"],
  // Row 4 — head, full width
  ["W","W","W","W","W","W","W","W","W","W","W","W","W","W","W","W"],
  // Row 5 — upper face
  ["W","W","W","W","W","W","W","W","W","W","W","W","W","W","W","W"],
  // Row 6 — eye patch top (3px wide, left center at 4, right center at 11)
  ["W","W","W","P","P","P","W","W","W","W","P","P","P","W","W","W"],
  // Row 7 — eye patch middle with white highlight inside
  ["W","W","P","P","W","P","P","W","W","P","P","W","P","P","W","W"],
  // Row 8 — eye patch bottom
  ["W","W","W","P","P","P","W","W","W","W","P","P","P","W","W","W"],
  // Row 9 — nose (2px, centered at 7-8)
  ["W","W","W","W","W","W","W","P","P","W","W","W","W","W","W","W"],
  // Row 10 — lower face
  ["W","W","W","W","W","W","W","W","W","W","W","W","W","W","W","W"],
  // Row 11 — chin
  ["_","W","W","W","W","W","W","W","W","W","W","W","W","W","W","_"],
  // Row 12 — neck
  ["_","_","W","W","W","W","W","W","W","W","W","W","W","W","_","_"],
  // Row 13-16 — body with red suspenders at cols 6 and 9
  ["_","_","_","E","W","W","R","W","W","R","W","W","E","_","_","_"],
  ["_","_","_","E","W","W","R","W","W","R","W","W","E","_","_","_"],
  ["_","_","_","E","W","W","R","W","W","R","W","W","E","_","_","_"],
  ["_","_","_","E","W","W","R","W","W","R","W","W","E","_","_","_"],
  // Row 17 — lower body
  ["_","_","_","E","E","W","W","W","W","W","W","E","E","_","_","_"],
  // Row 18 — legs
  ["_","_","_","_","E","E","_","_","_","_","E","E","_","_","_","_"],
  // Row 19 — padding
  ["_","_","_","_","_","_","_","_","_","_","_","_","_","_","_","_"],
];

const COLOR: Record<Px, string | null> = {
  _: null,
  E: "#3d3d3d",
  W: "#f0ede6",
  P: "#222222",
  R: "#cc2222",
};

export default function PandaMascot({ className }: { className?: string }) {
  const svgW = COLS * SCALE;
  const svgH = ROWS * SCALE;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {SPRITE.map((row, y) =>
        row.map((px, x) => {
          const fill = COLOR[px];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * SCALE}
              y={y * SCALE}
              width={SCALE}
              height={SCALE}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}
