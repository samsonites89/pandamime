"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styled from "styled-components";
import ColorPicker from "@/components/ColorPicker";
import ResultsGrid from "@/components/ResultsGrid";
import Disclaimer from "@/components/Disclaimer";
import PandaMascot from "@/components/PandaMascot";
import { findClosest, type PantoneMatch } from "@/lib/matcher";
import { normalizeHex, getContrastColor } from "@/lib/color";

const DEFAULT_COLOR = "#cc2222";
const DEFAULT_COUNT = 5;
const DEBOUNCE_MS = 150;

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialColor = (() => {
    const c = searchParams.get("c");
    if (c) {
      const normalized = normalizeHex(`#${c}`) ?? normalizeHex(c);
      if (normalized) return normalized;
    }
    return DEFAULT_COLOR;
  })();

  const [color, setColor] = useState(initialColor);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [matches, setMatches] = useState<PantoneMatch[]>(() =>
    findClosest(initialColor, DEFAULT_COUNT)
  );

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runMatch = useCallback(
    (hex: string, n: number) => {
      try {
        setMatches(findClosest(hex, n));
      } catch {
        // invalid color — leave results as-is
      }
    },
    []
  );

  const handleColorChange = useCallback(
    (hex: string) => {
      setColor(hex);
      router.replace(`?c=${hex.slice(1)}`, { scroll: false });

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => runMatch(hex, count), DEBOUNCE_MS);
    },
    [count, router, runMatch]
  );

  const handleCountChange = useCallback(
    (n: number) => {
      setCount(n);
      runMatch(color, n);
    },
    [color, runMatch]
  );

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  return (
    <Page>
      <Header>
        <Brand>
          <PandaMascot />
          <BrandText>
            <WordMark>PANDAMIME</WordMark>
            <Tagline>find your closest Pantone® colors</Tagline>
          </BrandText>
        </Brand>
        <Nav>
          <NavLink href="/about">ABOUT</NavLink>
        </Nav>
      </Header>

      <Hero>
        <HeroInner>
          <PickerPanel>
            <PanelLabel>PICK A COLOR</PanelLabel>
            <ColorPicker value={color} onChange={handleColorChange} />
          </PickerPanel>
          <HeroBlurb>
            <BlurbTitle>WHAT IS THIS?</BlurbTitle>
            <BlurbText>
              Drop any color — use the wheel or type a hex / RGB value.
              Pandamime finds the closest named{" "}
              <Accent>Pantone® fashion colors</Accent> by perceptual distance
              (CIEDE2000 in Lab space), not by eye or RGB proximity.
            </BlurbText>
            <BlurbText>
              Results are <Accent>approximate matches</Accent> — not
              conversions. Always verify against an official Pantone swatch
              before production use.
            </BlurbText>
            <StatRow>
              <Stat>
                <StatNum>1,900+</StatNum>
                <StatLabel>NAMED COLORS</StatLabel>
              </Stat>
              <Stat>
                <StatNum>3</StatNum>
                <StatLabel>FASHION BOOKS</StatLabel>
              </Stat>
              <Stat>
                <StatNum>ΔE</StatNum>
                <StatLabel>CIEDE2000</StatLabel>
              </Stat>
            </StatRow>
          </HeroBlurb>
        </HeroInner>
      </Hero>

      <Main>
        <ColorPreviewBar style={{ background: color }}>
          <PreviewLabel style={{ color: getContrastColor(color) }}>
            {color.toUpperCase()}
          </PreviewLabel>
        </ColorPreviewBar>
        <ResultsGrid
          matches={matches}
          count={count}
          onCountChange={handleCountChange}
        />
      </Main>

      <Footer>
        <Disclaimer />
        <FooterLinks>
          <NavLink href="/about">methodology</NavLink>
          <FooterSep>·</FooterSep>
          <FooterNote>dataset: sampled from public Pantone® color chips</FooterNote>
        </FooterLinks>
        <FooterCopy>© {new Date().getFullYear()} Pandamime. All rights reserved.</FooterCopy>
      </Footer>
    </Page>
  );
}

export default function Home() {
  return (
    <Suspense>
      <AppContent />
    </Suspense>
  );
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 2px solid #1a1a1a;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const WordMark = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 32px;
  font-weight: 700;
  color: #f5f5f0;
  letter-spacing: 3px;
  line-height: 1;
`;

const Tagline = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  font-weight: 400;
  color: #cc2222;
  letter-spacing: 1px;
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled.a`
  font-family: "Pixelify Sans", monospace;
  font-size: 13px;
  font-weight: 400;
  color: #888;
  text-decoration: none;
  &:hover {
    color: #cc2222;
  }
`;

const Hero = styled.section`
  padding: 48px 32px;
  border-bottom: 2px solid #1a1a1a;
`;

const HeroInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 64px;
  align-items: start;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const PickerPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PanelLabel = styled.p`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  font-weight: 700;
  color: #888;
  letter-spacing: 1px;
`;

const HeroBlurb = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
`;

const BlurbTitle = styled.h2`
  font-family: "Pixelify Sans", monospace;
  font-size: 16px;
  font-weight: 700;
  color: #f5f5f0;
  letter-spacing: 1px;
`;

const BlurbText = styled.p`
  font-size: 13px;
  color: #aaa;
  line-height: 1.8;
`;

const Accent = styled.em`
  font-style: normal;
  color: #cc2222;
`;

const StatRow = styled.div`
  display: flex;
  gap: 32px;
  margin-top: 8px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatNum = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 20px;
  font-weight: 700;
  color: #f5f5f0;
`;

const StatLabel = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  font-weight: 400;
  color: #777;
  letter-spacing: 1px;
`;

const Main = styled.main`
  flex: 1;
  padding: 40px 32px;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ColorPreviewBar = styled.div`
  height: 36px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
`;

const PreviewLabel = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  /* color is set inline via getContrastColor */
`;

const Footer = styled.footer`
  padding: 32px;
  border-top: 2px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FooterSep = styled.span`
  color: #444;
  font-size: 12px;
`;

const FooterNote = styled.span`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #555;
`;

const FooterCopy = styled.p`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  font-weight: 400;
  color: #444;
  letter-spacing: 0.5px;
`;
