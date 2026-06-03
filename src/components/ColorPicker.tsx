"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { converter, formatHex } from "culori";
import { normalizeHex, hexToRgb, rgbToHex, clampChannel } from "@/lib/color";

// HSL converter — used only for the lightness slider; all external state stays as #rrggbb.
const toHsl = converter("hsl");

function getLightness(hex: string): number {
  const hsl = toHsl(hex);
  return Math.round((hsl?.l ?? 0.5) * 100);
}

// Returns the pure-hue midpoint color (#rrggbb at L=50%) for the gradient track.
function getMidColor(hex: string): string {
  const hsl = toHsl(hex);
  if (!hsl) return "#888888";
  return formatHex({ ...hsl, l: 0.5 }) ?? "#888888";
}

interface Props {
  value: string; // canonical #rrggbb
  onChange: (hex: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const iroRef = useRef<unknown>(null);
  const suppressRef = useRef(false);

  const [hexInput, setHexInput] = useState(value.slice(1).toUpperCase());
  const [rgbInput, setRgbInput] = useState(() => {
    const { r, g, b } = hexToRgb(value);
    return { r: String(r), g: String(g), b: String(b) };
  });
  const [hexError, setHexError] = useState(false);
  const [lightness, setLightness] = useState(() => getLightness(value));

  // Keep all text fields and lightness in sync when value changes from outside.
  useEffect(() => {
    setHexInput(value.slice(1).toUpperCase());
    const { r, g, b } = hexToRgb(value);
    setRgbInput({ r: String(r), g: String(g), b: String(b) });
    setHexError(false);
    setLightness(getLightness(value));
  }, [value]);

  // Initialize iro.js wheel after mount (requires DOM + browser APIs).
  useEffect(() => {
    let picker: { color: { hexString: string }; on: (e: string, cb: (c: { hexString: string }) => void) => void; off: (e: string, cb: unknown) => void; destroy: () => void } | null = null;

    import("@jaames/iro").then(({ default: iro }) => {
      if (!wheelRef.current) return;

      const iroUi = (iro as unknown as { ui: { Box: unknown; Slider: unknown } }).ui;
      picker = new (iro as unknown as { ColorPicker: new (el: HTMLDivElement, opts: object) => typeof picker }
      ).ColorPicker(wheelRef.current, {
        width: 200,
        color: value,
        layout: [
          { component: iroUi.Box },
          { component: iroUi.Slider, options: { sliderType: "hue" } },
        ],
        borderWidth: 0,
        handleRadius: 7,
        sliderSize: 14,
        padding: 6,
      });

      iroRef.current = picker;

      const onColorChange = (color: { hexString: string }) => {
        if (suppressRef.current) return;
        onChange(color.hexString.toLowerCase());
      };

      picker!.on("color:change", onColorChange);

      return () => {
        picker!.off("color:change", onColorChange);
        picker!.destroy();
      };
    });

    return () => { picker?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync wheel when value changes from any text input or slider.
  useEffect(() => {
    const picker = iroRef.current as { color: { hexString: string } } | null;
    if (!picker) return;
    suppressRef.current = true;
    picker.color.hexString = value;
    suppressRef.current = false;
  }, [value]);

  const handleHexChange = useCallback(
    (raw: string) => {
      setHexInput(raw);
      const normalized = normalizeHex(raw);
      if (normalized) {
        setHexError(false);
        const { r, g, b } = hexToRgb(normalized);
        setRgbInput({ r: String(r), g: String(g), b: String(b) });
        onChange(normalized);
      } else {
        setHexError(raw.length > 0);
      }
    },
    [onChange]
  );

  const handleRgbChange = useCallback(
    (channel: "r" | "g" | "b", raw: string) => {
      const next = { ...rgbInput, [channel]: raw };
      setRgbInput(next);
      const r = clampChannel(next.r);
      const g = clampChannel(next.g);
      const b = clampChannel(next.b);
      const hex = rgbToHex({ r, g, b });
      setHexInput(hex.slice(1).toUpperCase());
      setHexError(false);
      onChange(hex);
    },
    [rgbInput, onChange]
  );

  // Swap only the L channel in HSL space; hue and saturation are preserved.
  const handleLightnessChange = useCallback(
    (pct: number) => {
      setLightness(pct);
      const hsl = toHsl(value);
      if (!hsl) return;
      const newHex = formatHex({ ...hsl, l: pct / 100 });
      if (newHex) onChange(newHex);
    },
    [value, onChange]
  );

  const rgb = hexToRgb(value);
  const midColor = getMidColor(value);
  const trackGradient = `linear-gradient(to right, #000000, ${midColor}, #ffffff)`;

  return (
    <Wrapper>
      <WheelContainer ref={wheelRef} />
      <Preview style={{ background: value }} aria-label={`Current color: ${value}`} />
      <Fields>
        <FieldGroup>
          <Label $error={hexError}>HEX</Label>
          <HexInput
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            maxLength={7}
            placeholder="FFD400"
            $error={hexError}
            aria-label="Hex color value"
            spellCheck={false}
          />
          {hexError && <ErrorHint>invalid hex</ErrorHint>}
        </FieldGroup>
        <RgbRow>
          {(["r", "g", "b"] as const).map((ch) => (
            <FieldGroup key={ch}>
              <Label>{ch.toUpperCase()}</Label>
              <RgbInput
                type="number"
                min={0}
                max={255}
                value={rgbInput[ch]}
                onChange={(e) => handleRgbChange(ch, e.target.value)}
                aria-label={`${ch.toUpperCase()} channel`}
              />
            </FieldGroup>
          ))}
        </RgbRow>

        <LightnessGroup>
          <LightnessHeader>
            <Label as="span">LIGHTNESS</Label>
            <LightnessPct>{lightness}%</LightnessPct>
          </LightnessHeader>
          <SliderTrackWrapper>
            <SliderTrack style={{ background: trackGradient }} />
            <LightnessSlider
              type="range"
              min={0}
              max={100}
              value={lightness}
              onChange={(e) => handleLightnessChange(Number(e.target.value))}
              aria-label="Lightness"
            />
          </SliderTrackWrapper>
          <SliderEndLabels>
            <span>dark</span>
            <span>light</span>
          </SliderEndLabels>
        </LightnessGroup>

        <ColorInfo>
          <InfoRow>
            <InfoLabel>RGB</InfoLabel>
            <InfoValue>{rgb.r}, {rgb.g}, {rgb.b}</InfoValue>
          </InfoRow>
        </ColorInfo>
      </Fields>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const WheelContainer = styled.div`
  line-height: 0;
`;

const Preview = styled.div`
  width: 100%;
  height: 32px;
  border: 2px solid #333;
  box-shadow:
    -2px -2px 0 #111,
    2px 2px 0 #555;
  image-rendering: pixelated;
`;

const Fields = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
`;

const Label = styled.label<{ $error?: boolean }>`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  color: ${(p) => (p.$error ? "#cc2222" : "#888")};
  letter-spacing: 1px;
`;

const baseInput = `
  background: #111;
  border: 2px solid #333;
  color: #f5f5f0;
  font-family: "Courier New", monospace;
  font-size: 14px;
  padding: 6px 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: #cc2222;
  }
`;

const HexInput = styled.input<{ $error?: boolean }>`
  ${baseInput}
  border-color: ${(p) => (p.$error ? "#cc2222" : "#333")};
  text-transform: uppercase;
`;

const RgbRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`;

const RgbInput = styled.input`
  ${baseInput}
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
  }
`;

const ErrorHint = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  color: #cc2222;
  position: absolute;
  bottom: -16px;
  left: 0;
`;

// ─── Lightness slider ────────────────────────────────────────────────────────

const LightnessGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
`;

const LightnessHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LightnessPct = styled.span`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #666;
`;

const SliderTrackWrapper = styled.div`
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
`;

const SliderTrack = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  border: 2px solid #333;
  pointer-events: none;
`;

const LightnessSlider = styled.input`
  position: relative;
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 16px;
    background: #cc2222;
    border: 2px solid #f5f5f0;
    cursor: pointer;
    image-rendering: pixelated;
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 16px;
    background: #cc2222;
    border: 2px solid #f5f5f0;
    cursor: pointer;
  }
`;

const SliderEndLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: "Pixelify Sans", monospace;
  font-size: 10px;
  color: #444;
`;

// ─── Color info ──────────────────────────────────────────────────────────────

const ColorInfo = styled.div`
  margin-top: 4px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const InfoLabel = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  color: #555;
`;

const InfoValue = styled.span`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #666;
`;
