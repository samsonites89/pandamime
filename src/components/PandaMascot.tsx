"use client";

// Pixel art pantomime panda: white face, black eye-diamond face paint, red suspenders.
// Built as a grid of colored <rect> elements — no external assets.

const W = 16; // sprite width in pixels
const H = 20; // sprite height in pixels
const SCALE = 3;

// _ = transparent, B = black, W = white, G = gray (ear inner), R = red (suspender)
type Px = "_" | "B" | "W" | "G" | "R";

const SPRITE: Px[][] = [
  // Row 0-1: ears
  ["_","_","_","B","B","_","_","_","_","_","_","B","B","_","_","_"],
  ["_","_","B","B","G","B","_","_","_","_","B","G","B","B","_","_"],
  // Row 2-3: top of head
  ["_","_","B","W","W","B","B","B","B","B","B","W","W","B","_","_"],
  ["_","B","W","W","W","W","W","W","W","W","W","W","W","W","B","_"],
  // Row 4-5: forehead
  ["_","B","W","W","W","W","W","W","W","W","W","W","W","W","B","_"],
  ["B","W","W","W","W","W","W","W","W","W","W","W","W","W","W","B"],
  // Row 6-7: eye-diamond face paint
  ["B","W","W","B","B","B","W","W","W","W","B","B","B","W","W","B"],
  ["B","W","B","B","W","B","B","W","W","B","B","W","B","B","W","B"],
  // Row 8-9: eyes (white inner with black pupil) + cheek
  ["B","W","B","W","B","W","B","W","W","B","W","B","W","B","W","B"],
  ["B","W","B","B","W","B","B","W","W","B","B","W","B","B","W","B"],
  // Row 10-11: nose area
  ["B","W","W","B","B","B","W","W","W","W","B","B","B","W","W","B"],
  ["B","W","W","W","W","W","B","B","B","B","W","W","W","W","W","B"],
  // Row 12: mouth / chin
  ["_","B","W","W","W","B","W","W","W","W","B","W","W","W","B","_"],
  // Row 13: neck
  ["_","_","B","W","W","W","W","W","W","W","W","W","W","B","_","_"],
  // Row 14: collar/top of body — suspenders start here
  ["_","_","B","B","W","W","B","W","W","B","W","W","B","B","_","_"],
  // Row 15-16: suspenders on body
  ["_","_","_","B","R","W","B","W","W","B","W","R","B","_","_","_"],
  ["_","_","_","B","R","W","W","W","W","W","W","R","B","_","_","_"],
  // Row 17-18: lower body
  ["_","_","_","B","R","W","W","W","W","W","W","R","B","_","_","_"],
  ["_","_","_","B","B","B","W","W","W","W","B","B","B","_","_","_"],
  // Row 19: legs
  ["_","_","_","_","B","B","_","_","_","_","B","B","_","_","_","_"],
];

const COLOR: Record<Px, string | null> = {
  _: null,
  B: "#1a1a1a",
  W: "#f5f5f0",
  G: "#c8a0a0",
  R: "#cc2222",
};

export default function PandaMascot({ className }: { className?: string }) {
  const svgW = W * SCALE;
  const svgH = H * SCALE;

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
