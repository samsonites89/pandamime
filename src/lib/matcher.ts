// Self-sampled approximations from Pantone chip images — not official Pantone data.
import { converter, differenceCiede2000, type Color } from "culori";
import collapsed from "@/data/named_table_collapsed.json";

export type PantoneMatch = {
  code: string;
  name: string;
  hex: string;
  materials: string[];
  // 0 = identical; <2 ~ imperceptible; 2–5 close; 5–10 loose; >10 nearest available
  deltaE: number;
};

const toLab = converter("lab");
const ciede2000 = differenceCiede2000();

// Precompute Lab values once at module load — each search is then just a linear distance sweep.
const DATASET = (collapsed as Array<{ code: string; name: string; hex: string; materials: string[] }>).map(
  (c) => ({ ...c, _lab: toLab(c.hex) })
);

export function findClosest(input: string, n = 5): PantoneMatch[] {
  const target = toLab(input);
  if (!target) throw new Error(`Unparseable color: ${input}`);

  const count = Math.min(Math.max(Math.round(n), 1), 10);

  return DATASET.map((c) => ({ c, d: ciede2000(target as Color, c._lab as Color) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(({ c, d }) => ({
      code: c.code,
      name: c.name,
      hex: c.hex,
      materials: c.materials,
      deltaE: Math.round(d * 100) / 100,
    }));
}

export function deltaELabel(deltaE: number): string {
  if (deltaE < 2) return "very close";
  if (deltaE < 5) return "close";
  if (deltaE < 10) return "loose";
  return "nearest available";
}
