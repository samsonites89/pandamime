import { describe, it, expect } from "vitest";
import { normalizeHex, hexToRgb, rgbToHex, isValidColor } from "../color";

describe("normalizeHex", () => {
  it("accepts full hex with hash", () => {
    expect(normalizeHex("#ffd400")).toBe("#ffd400");
  });
  it("accepts full hex without hash", () => {
    expect(normalizeHex("ffd400")).toBe("#ffd400");
  });
  it("expands shorthand hex", () => {
    expect(normalizeHex("#f0a")).toBe("#ff00aa");
    expect(normalizeHex("f0a")).toBe("#ff00aa");
  });
  it("accepts rgb() notation", () => {
    expect(normalizeHex("rgb(255, 212, 0)")).toBe("#ffd400");
  });
  it("returns null for invalid input", () => {
    expect(normalizeHex("not-a-color")).toBeNull();
    expect(normalizeHex("#xyz")).toBeNull();
    expect(normalizeHex("")).toBeNull();
  });
  it("normalizes to lowercase", () => {
    expect(normalizeHex("#FFD400")).toBe("#ffd400");
  });
});

describe("hexToRgb / rgbToHex roundtrip", () => {
  it("roundtrips correctly", () => {
    const hex = "#ffd400";
    expect(rgbToHex(hexToRgb(hex))).toBe(hex);
  });
  it("clamps out-of-range channels", () => {
    expect(rgbToHex({ r: -10, g: 300, b: 128 })).toBe("#00ff80");
  });
});

describe("isValidColor", () => {
  it("returns true for valid colors", () => {
    expect(isValidColor("#ffd400")).toBe(true);
    expect(isValidColor("rgb(0,0,0)")).toBe(true);
  });
  it("returns false for invalid input", () => {
    expect(isValidColor("banana")).toBe(false);
  });
});
