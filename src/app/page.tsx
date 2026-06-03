"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styled, { keyframes } from "styled-components";
import ColorPicker from "@/components/ColorPicker";
import ResultsGrid from "@/components/ResultsGrid";
import Disclaimer from "@/components/Disclaimer";
import PandaMascot from "@/components/PandaMascot";
import LoadingScreen from "@/components/LoadingScreen";
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
  // Starts false on both server and first client render (no hydration mismatch),
  // then flips after mount to fade out the splash.
  const [loaded, setLoaded] = useState(false);

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

  // Hold the splash briefly so it reads as intentional, then fade it out.
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <Page>
      <LoadingScreen hidden={loaded} />
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
        <MainInner>
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
        </MainInner>
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

// Gentle entrance used to stagger the hero and results in on first paint.
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 2px solid #1a1a1a;

  @media (max-width: 480px) {
    padding: 16px;
    /* Top-align so ABOUT sits level with the wordmark, not floating at the
       vertical center of the taller brand block. */
    align-items: flex-start;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    gap: 10px;
    /* Scale the pixel panda down a touch so the brand fits with the link. */
    & > svg {
      width: 48px;
      height: 60px;
    }
  }
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

  @media (max-width: 480px) {
    font-size: 22px;
    letter-spacing: 2px;
  }
`;

const Tagline = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 12px;
  font-weight: 400;
  color: #cc2222;
  letter-spacing: 1px;

  @media (max-width: 480px) {
    font-size: 10px;
    letter-spacing: 0.5px;
  }
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
  animation: ${fadeInUp} 0.4s ease both;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PickerPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Grid item must be allowed to shrink below the iro canvas's intrinsic width,
     otherwise the column stays propped open and the picker can't shrink back. */
  min-width: 0;
  /* Single-column: center the label with the now-centered picker block. */
  @media (max-width: 700px) {
    align-items: center;
    order: 2;
  }
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
  @media (max-width: 700px) {
    order: 1;
  }
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
  /* Mirror Hero: full-width section padding sits OUTSIDE the 960px content
     column (vs. inside it), so Main's content lines up flush with HeroInner. */
  padding: 40px 32px;
`;

const MainInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* Slight delay after the hero so the page settles in two beats. */
  animation: ${fadeInUp} 0.4s ease 0.1s both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ColorPreviewBar = styled.div`
  height: 36px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  /* Ease between colors as the picker changes instead of hard-cutting. */
  transition: background 0.2s ease;
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
