"use client";

import { useState, useCallback } from "react";
import styled from "styled-components";
import { type PantoneMatch, deltaELabel } from "@/lib/matcher";

interface Props {
  match: PantoneMatch;
  rank: number;
}

export default function ResultCard({ match, rank }: Props) {
  const [copiedField, setCopiedField] = useState<"code" | "hex" | null>(null);

  const copy = useCallback((text: string, field: "code" | "hex") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    });
  }, []);

  const label = deltaELabel(match.deltaE);

  return (
    <Card>
      <Swatch style={{ background: match.hex }} aria-hidden="true" />
      <Body>
        <TopRow>
          <Rank>#{rank}</Rank>
          <DeltaE>
            <DeltaVal>ΔE {match.deltaE.toFixed(2)}</DeltaVal>
            <DeltaLabel $rating={label}>{label}</DeltaLabel>
          </DeltaE>
        </TopRow>
        <ColorName>{match.name}</ColorName>
        <CopyRow>
          <CopyBtn
            onClick={() => copy(match.code, "code")}
            title="Copy code"
            $copied={copiedField === "code"}
          >
            <BtnLabel>{copiedField === "code" ? "COPIED!" : match.code}</BtnLabel>
          </CopyBtn>
          <CopyBtn
            onClick={() => copy(match.hex, "hex")}
            title="Copy hex"
            $copied={copiedField === "hex"}
          >
            <BtnLabel>{copiedField === "hex" ? "COPIED!" : match.hex.toUpperCase()}</BtnLabel>
          </CopyBtn>
        </CopyRow>
        <Materials>
          {match.materials.map((m) => (
            <MaterialTag key={m}>{m}</MaterialTag>
          ))}
        </Materials>
      </Body>
    </Card>
  );
}

// --- pixel-border mixin via box-shadow ---
const pixelBorder = `
  box-shadow:
    -2px 0 0 #2a2a2a,
    2px 0 0 #2a2a2a,
    0 -2px 0 #2a2a2a,
    0 2px 0 #2a2a2a;
`;

const Card = styled.article`
  background: #111;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${pixelBorder}
  transition: transform 0.08s;
  &:hover {
    transform: translateY(-2px);
    box-shadow:
      -2px 0 0 #cc2222,
      2px 0 0 #cc2222,
      0 -2px 0 #cc2222,
      0 4px 0 #cc2222;
  }
`;

const Swatch = styled.div`
  height: 80px;
  width: 100%;
  image-rendering: pixelated;
`;

const Body = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Rank = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  color: #444;
`;

const DeltaE = styled.div`
  text-align: right;
`;

const DeltaVal = styled.div`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #888;
`;

const ratingColor: Record<string, string> = {
  "very close": "#22cc66",
  "close": "#88cc22",
  "loose": "#cc8822",
  "nearest available": "#cc2222",
};

const DeltaLabel = styled.div<{ $rating: string }>`
  font-family: "Pixelify Sans", monospace;
  font-size: 10px;
  color: ${(p) => ratingColor[p.$rating] ?? "#888"};
  margin-top: 2px;
`;

const ColorName = styled.h3`
  font-family: "Pixelify Sans", monospace;
  font-size: 13px;
  color: #f5f5f0;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
`;

const CopyRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  background: ${(p) => (p.$copied ? "#cc2222" : "#1a1a1a")};
  border: none;
  padding: 5px 8px;
  cursor: pointer;
  text-align: left;
  box-shadow: -1px 0 0 #333, 1px 0 0 #333, 0 -1px 0 #333, 0 1px 0 #333;
  transition: background 0.1s;
  &:hover {
    background: ${(p) => (p.$copied ? "#cc2222" : "#222")};
  }
  &:active {
    transform: translateY(1px);
  }
`;

const BtnLabel = styled.span`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #aaa;
  letter-spacing: 0.5px;
`;

const Materials = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const MaterialTag = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 10px;
  color: #555;
  padding: 2px 5px;
  border: 1px solid #333;
`;
