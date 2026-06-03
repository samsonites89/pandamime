// Parsing/normalization helpers for hex and RGB color inputs.
// All internal state is #rrggbb; wheel and text fields sync from this canonical form.

export type RgbTriple = { r: number; g: number; b: number };

const SHORT_HEX = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const FULL_HEX = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Normalizes any supported color string to #rrggbb, or returns null on failure. */
export function normalizeHex(input: string): string | null {
  const s = input.trim();

  const short = SHORT_HEX.exec(s);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }

  const full = FULL_HEX.exec(s);
  if (full) {
    return `#${full[1]}${full[2]}${full[3]}`.toLowerCase();
  }

  const rgb = RGB_FN.exec(s);
  if (rgb) {
    return rgbToHex({
      r: parseInt(rgb[1]),
      g: parseInt(rgb[2]),
      b: parseInt(rgb[3]),
    });
  }

  return null;
}

export function hexToRgb(hex: string): RgbTriple {
  const full = FULL_HEX.exec(hex);
  if (!full) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(full[1], 16),
    g: parseInt(full[2], 16),
    b: parseInt(full[3], 16),
  };
}

export function rgbToHex({ r, g, b }: RgbTriple): string {
  return `#${clampByte(r).toString(16).padStart(2, "0")}${clampByte(g).toString(16).padStart(2, "0")}${clampByte(b).toString(16).padStart(2, "0")}`;
}

/** Returns true for any input that normalizeHex accepts. */
export function isValidColor(input: string): boolean {
  return normalizeHex(input) !== null;
}

/** Clamps and rounds a single RGB channel value from a raw string input. */
export function clampChannel(value: string): number {
  const n = parseInt(value, 10);
  return isNaN(n) ? 0 : clampByte(n);
}
