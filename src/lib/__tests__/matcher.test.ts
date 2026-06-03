import { describe, it, expect } from "vitest";
import { findClosest } from "../matcher";
import collapsed from "@/data/named_table_collapsed.json";

describe("findClosest", () => {
  it("returns exact match first with deltaE ≈ 0", () => {
    const firstColor = (collapsed as Array<{ hex: string }>)[0];
    const results = findClosest(firstColor.hex, 5);
    expect(results[0].deltaE).toBeCloseTo(0, 1);
    expect(results[0].hex).toBe(firstColor.hex);
  });

  it("returns results in non-decreasing deltaE order", () => {
    const results = findClosest("#ff6600", 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].deltaE).toBeGreaterThanOrEqual(results[i - 1].deltaE);
    }
  });

  it("clamps n to max 10", () => {
    expect(findClosest("#ffffff", 99)).toHaveLength(10);
  });

  it("clamps n to min 1", () => {
    expect(findClosest("#000000", 0)).toHaveLength(1);
    expect(findClosest("#000000", -5)).toHaveLength(1);
  });

  it("throws on unparseable input", () => {
    expect(() => findClosest("not-a-color")).toThrow("Unparseable color");
  });

  it("finds a yellow near #ffff00", () => {
    const results = findClosest("#ffff00", 5);
    const names = results.map((r) => r.name.toLowerCase());
    const hasYellow = names.some(
      (n) => n.includes("yellow") || n.includes("lemon") || n.includes("cyber")
    );
    expect(hasYellow).toBe(true);
  });
});
