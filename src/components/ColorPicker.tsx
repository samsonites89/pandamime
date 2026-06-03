"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { normalizeHex, hexToRgb, rgbToHex, clampChannel } from "@/lib/color";

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

  // Keep text fields in sync when value changes from outside (URL load, etc.)
  useEffect(() => {
    setHexInput(value.slice(1).toUpperCase());
    const { r, g, b } = hexToRgb(value);
    setRgbInput({ r: String(r), g: String(g), b: String(b) });
    setHexError(false);
  }, [value]);

  // Initialize iro.js wheel after mount (it requires DOM + browser APIs)
  useEffect(() => {
    let picker: { color: { hexString: string }; on: (e: string, cb: (c: { hexString: string }) => void) => void; off: (e: string, cb: unknown) => void; destroy: () => void } | null = null;

    import("@jaames/iro").then(({ default: iro }) => {
      if (!wheelRef.current) return;

      picker = new (iro as unknown as { ColorPicker: new (el: HTMLDivElement, opts: object) => typeof picker }
      ).ColorPicker(wheelRef.current, {
        width: 200,
        color: value,
        layout: [{ component: (iro as unknown as { ui: { Wheel: unknown } }).ui.Wheel }],
        borderWidth: 0,
        handleRadius: 7,
        sliderSize: 12,
        padding: 4,
        wheelLightness: true,
        wheelAngle: 0,
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

    return () => {
      picker?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync wheel when value changes from text inputs
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

  const rgb = hexToRgb(value);

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
  /* iro.js mounts into this div */
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
  font-family: "Press Start 2P", monospace;
  font-size: 8px;
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
  font-family: "Press Start 2P", monospace;
  font-size: 7px;
  color: #cc2222;
  position: absolute;
  bottom: -14px;
  left: 0;
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
  font-family: "Press Start 2P", monospace;
  font-size: 7px;
  color: #555;
`;

const InfoValue = styled.span`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #666;
`;
