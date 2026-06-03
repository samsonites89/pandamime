"use client";

import styled from "styled-components";
import { type PantoneMatch } from "@/lib/matcher";
import ResultCard from "./ResultCard";
import MiniCard from "./MiniCard";

interface Props {
  matches: PantoneMatch[];
  count: number;
  onCountChange: (n: number) => void;
}

// Below this viewport width the 3-column grid leaves each cell too tight for
// the full card, so each slot swaps to the compact MiniCard via CSS.
const COMPACT_BREAKPOINT = "640px";

export default function ResultsGrid({ matches, count, onCountChange }: Props) {
  return (
    <Section>
      <Header>
        <SectionTitle>CLOSEST APPROXIMATE MATCHES</SectionTitle>
        <SliderGroup>
          <SliderLabel>RESULTS: {count}</SliderLabel>
          <Slider
            type="range"
            min={1}
            max={9}
            value={count}
            onChange={(e) => onCountChange(Number(e.target.value))}
            aria-label="Number of results"
          />
        </SliderGroup>
      </Header>
      {matches.length === 0 ? (
        <Empty>pick a color to find matches</Empty>
      ) : (
        <Grid>
          {matches.map((m, i) => (
            // Each grid slot holds both variants; CSS shows the one that fits.
            // Only one is ever visible, so the doubled DOM is inert.
            <Slot key={m.code}>
              <FullVariant>
                <ResultCard match={m} rank={i + 1} />
              </FullVariant>
              <CompactVariant>
                <MiniCard match={m} rank={i + 1} />
              </CompactVariant>
            </Slot>
          ))}
        </Grid>
      )}
    </Section>
  );
}

const Slot = styled.div`
  min-width: 0;
`;

const FullVariant = styled.div`
  @media (max-width: ${COMPACT_BREAKPOINT}) {
    display: none;
  }
`;

const CompactVariant = styled.div`
  display: none;
  @media (max-width: ${COMPACT_BREAKPOINT}) {
    display: block;
  }
`;

const Section = styled.section`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  font-family: "Pixelify Sans", monospace;
  font-size: 13px;
  color: #555;
  letter-spacing: 1px;
  margin: 0;
`;

const SliderGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SliderLabel = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  color: #888;
  min-width: 90px;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  background: #333;
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #cc2222;
    cursor: pointer;
    image-rendering: pixelated;
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #cc2222;
    border: none;
    cursor: pointer;
  }
`;

const Grid = styled.div`
  display: grid;
  /* Always 3 columns; cells swap to MiniCard at narrow widths instead of
     reflowing to fewer columns. */
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: ${COMPACT_BREAKPOINT}) {
    gap: 8px;
  }
`;

const Empty = styled.p`
  font-family: "Pixelify Sans", monospace;
  font-size: 14px;
  color: #444;
  text-align: center;
  padding: 48px 0;
`;
