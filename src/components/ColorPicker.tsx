"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { converter, formatHex } from "culori";
import { normalizeHex, hexToRgb, rgbToHex, clampChannel } from "@/lib/color";

const toHsl = converter("hsl");

// iro.js renders at a fixed pixel width, so it can't flex with CSS like the
// inputs do. We measure the container and call iro's resize() to keep the
// square box matching its column. On desktop the picker sits in a ~260px
// column; when the layout collapses to a single column it may stretch up to
// this cap so it uses the extra width without becoming unwieldy.
const MAX_PICKER_WIDTH = 600;
const FALLBACK_WIDTH = 260;

function pickerWidthFrom(el: HTMLElement | null): number {
  const w = el?.clientWidth || FALLBACK_WIDTH;
  return Math.min(Math.round(w), MAX_PICKER_WIDTH);
}

function getLightness(hex: string): number {
  const hsl = toHsl(hex);
  return Math.round((hsl?.l ?? 0.5) * 100);
}

function getMidColor(hex: string): string {
  const hsl = toHsl(hex);
  if (!hsl) return "#888888";
  return formatHex({ ...hsl, l: 0.5 }) ?? "#888888";
}

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const iroRef = useRef<unknown>(null);
  const suppressRef = useRef(false);

  const [prevValue, setPrevValue] = useState(value);
  const [hexInput, setHexInput] = useState(value.slice(1).toUpperCase());
  const [rgbInput, setRgbInput] = useState(() => {
    const { r, g, b } = hexToRgb(value);
    return { r: String(r), g: String(g), b: String(b) };
  });
  const [hexError, setHexError] = useState(false);
  const [lightness, setLightness] = useState(() => getLightness(value));
  // iro loads via dynamic import, so the canvas appears a beat after first
  // paint. Until then, we show a sized skeleton so there's no blank hole / jump.
  const [ready, setReady] = useState(false);

  if (prevValue !== value) {
    setPrevValue(value);
    setHexInput(value.slice(1).toUpperCase());
    const { r, g, b } = hexToRgb(value);
    setRgbInput({ r: String(r), g: String(g), b: String(b) });
    setHexError(false);
    setLightness(getLightness(value));
  }

  useEffect(() => {
    let picker: { color: { hexString: string }; on: (e: string, cb: (c: { hexString: string }) => void) => void; off: (e: string, cb: unknown) => void; destroy: () => void } | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    import("@jaames/iro").then(({ default: iro }) => {
      if (!wheelRef.current) return;

      const iroUi = (iro as unknown as { ui: { Box: unknown; Slider: unknown } }).ui;
      picker = new (iro as unknown as { ColorPicker: new (el: HTMLDivElement, opts: object) => typeof picker }
      ).ColorPicker(wheelRef.current, {
        // Start at the container's current width; the ResizeObserver below keeps
        // it in sync as the layout reflows. (wheelRef is full-width until iro
        // injects its own sized canvas, so this reads the available width.)
        width: pickerWidthFrom(wheelRef.current),
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

      // Remove rounded corners from all SVG rect elements (rx/ry are not
      // overridable via CSS, so we patch them directly after init).
      wheelRef.current.querySelectorAll("rect").forEach((rect) => {
        rect.setAttribute("rx", "0");
        rect.setAttribute("ry", "0");
      });

      // Canvas is in the DOM now — drop the skeleton.
      setReady(true);

      const onColorChange = (color: { hexString: string }) => {
        if (suppressRef.current) return;
        // Debounce at 80ms so rapid drag events don't flood the parent with
        // re-renders and URL updates while still feeling live.
        const hex = color.hexString.toLowerCase();
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => onChange(hex), 200);
      };

      picker!.on("color:change", onColorChange);

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        picker!.off("color:change", onColorChange);
        picker!.destroy();
      };
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      picker?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const picker = iroRef.current as { color: { hexString: string } } | null;
    if (!picker) return;
    suppressRef.current = true;
    picker.color.hexString = value;
    suppressRef.current = false;
  }, [value]);

  // Keep iro's width in sync with its container as the layout reflows. We watch
  // wheelRef (full-width; unaffected by iro's own sized canvas inside it) so
  // resizing iro never feeds back into the observed element.
  useEffect(() => {
    const el = wheelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const picker = iroRef.current as { resize?: (w: number) => void } | null;
      picker?.resize?.(pickerWidthFrom(el));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleHexChange = useCallback(
    (raw: string) => {
      setHexInput(raw);
      // Only fire on a full 6-digit hex — 3-char shorthand normalizes too early
      // and triggers a color jump mid-typing (e.g. "FF0" → #ffff00 after 3 chars).
      const stripped = raw.replace(/^#/, "");
      const normalized = stripped.length === 6 ? normalizeHex(raw) : null;
      if (normalized) {
        setHexError(false);
        const { r, g, b } = hexToRgb(normalized);
        setRgbInput({ r: String(r), g: String(g), b: String(b) });
        onChange(normalized);
      } else {
        setHexError(raw.length > 0 && stripped.length >= 6);
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
      <PickerFrame>
        {/* Skeleton reserves the picker's space until iro's async chunk loads,
            so there's no blank hole or layout jump on refresh. It mirrors iro's
            box + hue-slider layout for a seamless swap. wheelRef stays a
            separate, React-empty node so iro can own its DOM unobstructed. */}
        {!ready && (
          <Skeleton aria-hidden="true">
            <SkelBox />
            <SkelSlider />
          </Skeleton>
        )}
        <WheelContainer ref={wheelRef} />
        <Preview style={{ background: value }} aria-label={`Current color: ${value}`} />
      </PickerFrame>

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
            autoComplete="off"
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
                autoComplete="off"
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
  gap: 16px;
  /* Fill the column up to a sensible cap, then center so the picker block stays
     comfortable (and aligned with its inputs) when the layout is single-column. */
  width: 100%;
  max-width: ${MAX_PICKER_WIDTH}px;
  margin: 0 auto;
  /* Allow shrinking below the iro canvas's intrinsic width (see WheelContainer). */
  min-width: 0;
`;

const PickerFrame = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* No border-radius anywhere inside iro.js */
  & * {
    border-radius: 0 !important;
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const skelPiece = css`
  background: #161616;
  box-shadow:
    -2px 0 0 #2a2a2a,
    2px 0 0 #2a2a2a,
    0 -2px 0 #2a2a2a,
    0 2px 0 #2a2a2a;
  animation: ${pulse} 1.2s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Skeleton = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const SkelBox = styled.div`
  ${skelPiece}
  width: 100%;
  /* Matches iro's square SV box. */
  aspect-ratio: 1 / 1;
`;

const SkelSlider = styled.div`
  ${skelPiece}
  width: 100%;
  height: 14px;
  /* Matches iro's sliderMargin (12px) + sliderSize (14px). */
  margin-top: 12px;
`;

const WheelContainer = styled.div`
  width: 100%;
  line-height: 0;
  font-size: 0;
  /* iro injects a fixed-width canvas. Without this, that canvas's intrinsic
     width sets a min-content size that props the column open and prevents it
     from shrinking back down on resize. Clipping resets the automatic minimum
     to 0 so the container tracks available width and the ResizeObserver can
     drive iro back down. (Handles stay within the canvas, so nothing visible
     is clipped.) */
  min-width: 0;
  overflow: hidden;
  /* iro.js renders each component's <svg> as display:inline by default, which
     leaves baseline descender space below the last element (the hue slider) —
     that's the gap. Forcing the svgs to block removes it so Preview sits flush. */
  & svg {
    display: block;
  }
`;

const Preview = styled.div`
  width: 100%;
  height: 24px;
  /* Match the iro Box, which is full-bleed (borderWidth: 0). A border here
     would eat 2px each side under the global box-sizing:border-box, making the
     swatch visibly narrower than the picker above it — so go borderless too. */
  /* iro's own inter-element spacing is sliderMargin (12px); reuse it so the
     swatch sits in the same vertical rhythm as the Box→Slider gap. */
  margin-top: 12px;
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
  font-weight: 700;
  color: ${(p) => (p.$error ? "#cc2222" : "#999")};
  letter-spacing: 1px;
`;

const baseInput = `
  background: #111;
  border: 2px solid #3a3a3a;
  color: #f0f0f0;
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
  border-color: ${(p) => (p.$error ? "#cc2222" : "#3a3a3a")};
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
  color: #aaa;
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
  border: 2px solid #3a3a3a;
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
    border: 2px solid #f0f0f0;
    cursor: pointer;
    image-rendering: pixelated;
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 16px;
    background: #cc2222;
    border: 2px solid #f0f0f0;
    cursor: pointer;
  }
`;

const SliderEndLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: "Pixelify Sans", monospace;
  font-size: 10px;
  color: #666;
`;

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
  font-weight: 700;
  color: #666;
`;

const InfoValue = styled.span`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #999;
`;
