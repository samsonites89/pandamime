"use client";

import styled from "styled-components";
import { type PantoneMatch } from "@/lib/matcher";
import ResultCard from "./ResultCard";

interface Props {
  matches: PantoneMatch[];
  count: number;
  onCountChange: (n: number) => void;
}

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
            max={10}
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
            <ResultCard key={m.code} match={m} rank={i + 1} />
          ))}
        </Grid>
      )}
    </Section>
  );
}

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
  font-family: "Press Start 2P", monospace;
  font-size: 9px;
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
  font-family: "Press Start 2P", monospace;
  font-size: 8px;
  color: #888;
  min-width: 80px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const Empty = styled.p`
  font-family: "Press Start 2P", monospace;
  font-size: 10px;
  color: #444;
  text-align: center;
  padding: 48px 0;
`;
