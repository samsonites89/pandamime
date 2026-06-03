"use client";

// Compact result card for narrow viewports where the 3-column grid leaves each
// cell too tight for the full ResultCard. Same data and copy affordances, with a
// horizontal swatch+name header that stacks vertically (swatch as a top strip)
// on very narrow cells. Material tags are dropped here to save space.

import { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { type PantoneMatch, deltaELabel } from "@/lib/matcher";

interface Props {
  match: PantoneMatch;
  rank: number;
}

export default function MiniCard({ match, rank }: Props) {
  const [copiedField, setCopiedField] = useState<"code" | "hex" | null>(null);

  const copy = useCallback((text: string, field: "code" | "hex") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    });
  }, []);

  const label = deltaELabel(match.deltaE);

  return (
    <Card style={{ animationDelay: `${Math.min(rank - 1, 8) * 0.04}s` }}>
      <Header>
        <Swatch style={{ background: match.hex }} aria-hidden="true" />
        <HeaderText>
          <MetaRow>
            <Rank>#{rank}</Rank>
            <DeltaVal $rating={label}>ΔE {match.deltaE.toFixed(2)}</DeltaVal>
          </MetaRow>
          <ColorName title={match.name}>{match.name}</ColorName>
        </HeaderText>
      </Header>
      <CopyRow>
        <CopyBtn
          onClick={() => copy(match.code, "code")}
          title="Copy code"
          $copied={copiedField === "code"}
        >
          {copiedField === "code" ? "COPIED!" : match.code}
        </CopyBtn>
        <CopyBtn
          onClick={() => copy(match.hex, "hex")}
          title="Copy hex"
          $copied={copiedField === "hex"}
        >
          {copiedField === "hex" ? "COPIED!" : match.hex.toUpperCase()}
        </CopyBtn>
      </CopyRow>
    </Card>
  );
}

const pixelBorder = `
  box-shadow:
    -2px 0 0 #2a2a2a,
    2px 0 0 #2a2a2a,
    0 -2px 0 #2a2a2a,
    0 2px 0 #2a2a2a;
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Card = styled.article`
  background: #111;
  display: flex;
  flex-direction: column;
  ${pixelBorder}
  transition: transform 0.08s;
  animation: ${fadeInUp} 0.3s ease both;
  &:hover {
    transform: translateY(-2px);
    box-shadow:
      -2px 0 0 #cc2222,
      2px 0 0 #cc2222,
      0 -2px 0 #cc2222,
      0 4px 0 #cc2222;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
  /* Top-align so the swatch stays put when the name wraps to two lines. */
  align-items: flex-start;

  /* At ~93px-wide cells (3 columns on a 360px screen) the swatch-left layout
     starves the text column, so stack vertically: swatch becomes a full-width
     strip and the name/meta get the whole card width. */
  @media (max-width: 400px) {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 6px;
  }
`;

const Swatch = styled.div`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  image-rendering: pixelated;
  transition: background 0.2s ease;
  box-shadow:
    -1px 0 0 #2a2a2a,
    1px 0 0 #2a2a2a,
    0 -1px 0 #2a2a2a,
    0 1px 0 #2a2a2a;

  @media (max-width: 400px) {
    width: 100%;
    height: 32px;
  }
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`;

/* Rank and ΔE share a compact top line, kept out of the name's text flow so the
   name below has one consistent left edge — its wrapped lines stay aligned. */
const MetaRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 5px;
`;

const Rank = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  font-weight: 700;
  color: #666;
`;

const ColorName = styled.h3`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  font-weight: 700;
  color: #f5f5f0;
  margin: 0;
  line-height: 1.3;
  overflow-wrap: break-word;
  word-break: break-word;

  @media (max-width: 400px) {
    font-size: 11px;
  }
`;

const ratingColor: Record<string, string> = {
  "very close": "#22cc66",
  close: "#88cc22",
  loose: "#cc8822",
  "nearest available": "#cc2222",
};

const DeltaVal = styled.span<{ $rating: string }>`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: ${(p) => ratingColor[p.$rating] ?? "#888"};
`;

const CopyRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px 8px;

  @media (max-width: 400px) {
    padding: 0 6px 6px;
  }
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  background: ${(p) => (p.$copied ? "#cc2222" : "#1a1a1a")};
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  text-align: left;
  font-family: "Courier New", monospace;
  font-size: 10px;
  color: ${(p) => (p.$copied ? "#fff" : "#aaa")};
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    background: ${(p) => (p.$copied ? "#cc2222" : "#222")};
  }
  &:active {
    transform: translateY(1px);
  }
`;
