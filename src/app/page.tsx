"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import styled, { keyframes, css } from "styled-components";
import ColorPicker from "@/components/ColorPicker";
import ResultsGrid from "@/components/ResultsGrid";
import Disclaimer from "@/components/Disclaimer";
import PandaMascot from "@/components/PandaMascot";
import LoadingScreen from "@/components/LoadingScreen";
import { findClosest, type PantoneMatch } from "@/lib/matcher";
import { normalizeHex, getContrastColor } from "@/lib/color";

const DEFAULT_COLOR = "#cc2222";
const DEFAULT_COUNT = 6;
// Each drag event resets this timer, so the calibrating modal only fires
// after the user has been still for this long.
const DESKTOP_MATCH_DEBOUNCE_MS = 600;

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
  // Start empty — desktop auto-fills on mount; mobile only fills on button click.
  const [matches, setMatches] = useState<PantoneMatch[]>([]);
  // Starts false on both server and first client render (no hydration mismatch),
  // then flips after mount to fade out the splash.
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("CALIBRATING…");
  const [isLoading, setIsLoading] = useState(false);
  // Tracks whether the user has triggered a match on mobile at least once.
  const [mobileReady, setMobileReady] = useState(false);
  // Pulses the Find Matches button when the user changes color on mobile.
  const [hinting, setHinting] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLElement>(null);

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

  // Shared modal → match → skeleton sequence used by all trigger paths.
  const runMatchWithDelay = useCallback(
    (hex: string, n: number) => {
      setShowModal(true);
      if (calcTimer.current) clearTimeout(calcTimer.current);
      calcTimer.current = setTimeout(() => {
        runMatch(hex, n);
        setShowModal(false);
        setIsLoading(true);
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(() => setIsLoading(false), 500);
      }, 800);
    },
    [runMatch]
  );

  const handleColorChange = useCallback(
    (hex: string) => {
      setColor(hex);
      router.replace(`?c=${hex.slice(1)}`, { scroll: false });
      // Desktop only: debounce then show calibrating modal.
      // Mobile waits for the explicit "Find Matches" button press.
      if (typeof window === "undefined" || window.innerWidth > 700) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          setModalText("CALIBRATING…");
          runMatchWithDelay(hex, count);
        }, DESKTOP_MATCH_DEBOUNCE_MS);
      } else {
        // Nudge the Find Matches button so the user knows the color changed.
        setHinting(false);
        setTimeout(() => {
          setHinting(true);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setHinting(false), 600);
        }, 0);
      }
    },
    [count, router, runMatchWithDelay]
  );

  const handleFindMatches = useCallback(() => {
    setMobileReady(true);
    mainRef.current?.scrollIntoView({ behavior: "smooth" });
    setModalText("MATCHING…");
    runMatchWithDelay(color, count);
  }, [color, count, runMatchWithDelay]);

  const handleCountChange = useCallback(
    (n: number) => {
      setCount(n);
      // On mobile, don't run a match until the user has clicked Find Matches at least once.
      if (typeof window !== "undefined" && window.innerWidth <= 700 && !mobileReady) return;
      setModalText("CALIBRATING…");
      runMatchWithDelay(color, n);
    },
    [color, mobileReady, runMatchWithDelay]
  );

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (calcTimer.current) clearTimeout(calcTimer.current);
      if (loadTimer.current) clearTimeout(loadTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    []
  );

  // Desktop: auto-run first match while the splash screen is still showing.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 700) {
      runMatch(initialColor, DEFAULT_COUNT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hold the splash briefly so it reads as intentional, then fade it out.
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <Page>
      <LoadingScreen hidden={loaded} />
      <Header style={{ viewTransitionName: "site-header" } as React.CSSProperties}>
        <Brand>
          <MascotFloat><PandaMascot /></MascotFloat>
          <BrandText>
            <TitleRow>
              <WordMark>PANDAMIME</WordMark>
              <PaletteGrid>
                {["#e8524a","#f5a623","#f7e03a","#6ab04c","#4a90d9","#9b59b6"].map((c) => (
                  <PaletteSquare key={c} style={{ background: c }} />
                ))}
              </PaletteGrid>
            </TitleRow>
            <Tagline>find your closest Pantone® colors</Tagline>
          </BrandText>
        </Brand>
        <Nav>
          <NavLink href="/about" transitionTypes={["nav-forward"]}>ABOUT</NavLink>
        </Nav>
      </Header>

      <Hero>
        <HeroInner>
          <PickerPanel>
            <PanelLabel>PICK A COLOR</PanelLabel>
            <ColorPicker value={color} onChange={handleColorChange} />
            <FindMatchesButton onClick={handleFindMatches} $hinting={hinting}>
              FIND MATCHES →
            </FindMatchesButton>
          </PickerPanel>
          <HeroBlurb>
            <BlurbTitle>🎨 WHAT IS THIS?</BlurbTitle>
            <BlurbText>
              <Strong>Drop any color</Strong> — use the wheel or type a hex / RGB value.
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
                <StatNum>🎨 3,100+</StatNum>
                <StatLabel>NAMED COLORS</StatLabel>
              </Stat>
              <Stat>
                <StatNum>📚 FIVE</StatNum>
                <StatLabel>FASHION BOOKS</StatLabel>
              </Stat>
              <Stat>
                <StatNum>🔬 ΔE</StatNum>
                <StatLabel>CIEDE2000</StatLabel>
              </Stat>
            </StatRow>
          </HeroBlurb>
        </HeroInner>
      </Hero>

      <Main ref={mainRef}>
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
            isLoading={isLoading}
            mobileReady={mobileReady}
          />
        </MainInner>
      </Main>

      {showModal && (
        <ModalOverlay>
          <ModalBox>{modalText}</ModalBox>
        </ModalOverlay>
      )}

      <Footer>
        <Disclaimer />
        <FooterLinks>
          <NavLink href="/about" transitionTypes={["nav-forward"]}>methodology</NavLink>
          <FooterSep>·</FooterSep>
          <FooterNote>🖼️ dataset: sampled from public Pantone® color chips</FooterNote>
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
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0);     }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0);   }
  50%       { transform: translateY(-5px); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1);    }
`;

const pixelPulse = keyframes`
  0%, 100% { box-shadow: none; }
  50%       { box-shadow: 0 0 0 3px rgba(204,34,34,0.35), 0 0 0 6px rgba(204,34,34,0.12); }
`;

const buttonNudge = keyframes`
  0%   { transform: translateY(0);    }
  20%  { transform: translateY(-6px); }
  40%  { transform: translateY(-2px); }
  60%  { transform: translateY(-5px); }
  80%  { transform: translateY(-1px); }
  100% { transform: translateY(0);    }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 2px solid #1a1a1a;
  animation: ${slideDown} 0.35s ease both;

  @media (max-width: 480px) {
    padding: 16px;
    /* Top-align so ABOUT sits level with the wordmark, not floating at the
       vertical center of the taller brand block. */
    align-items: flex-start;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PaletteGrid = styled.div`
  display: flex;
  gap: 3px;

  @media (max-width: 480px) {
    display: none;
  }
`;

const PaletteSquare = styled.div`
  width: 10px;
  height: 10px;
`;

const MascotFloat = styled.div`
  animation: ${float} 3s ease-in-out infinite;
  line-height: 0;

  @media (max-width: 480px) {
    & img {
      width: 48px;
      height: 60px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
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
  font-weight: 400;
  color: #f5f5f0;
  letter-spacing: 3px;
  line-height: 1;
  transition: color 0.15s ease, letter-spacing 0.15s ease;

  &:hover {
    color: #cc2222;
    letter-spacing: 5px;
  }

  @media (max-width: 480px) {
    font-size: 22px;
    letter-spacing: 2px;
    &:hover {
      letter-spacing: 3px;
    }
  }
`;

const Tagline = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 14px;
  font-weight: 300;
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

const NavLink = styled(Link)`
  font-family: "Pixelify Sans", monospace;
  font-size: 13px;
  font-weight: 400;
  color: #888;
  text-decoration: none;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: #cc2222;
    transition: width 0.2s ease;
  }
  &:hover {
    color: #cc2222;
  }
  &:hover::after {
    width: 100%;
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
  font-size: 19px;
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

const Strong = styled.strong`
  color: #f5f5f0;
  font-weight: 700;
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
  font-weight: 500;
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
  animation: ${fadeInUp} 0.4s ease 0.4s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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

const FindMatchesButton = styled.button<{ $hinting?: boolean }>`
  display: none;
  @media (max-width: 700px) {
    display: block;
    font-family: "Pixelify Sans", monospace;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #f5f5f0;
    background: #cc2222;
    border: none;
    padding: 10px 24px;
    cursor: pointer;
    width: 100%;
    ${(p) => p.$hinting
      ? css`animation: ${buttonNudge} 0.6s ease both;`
      : css`animation: ${pixelPulse} 2s ease-in-out infinite;`
    }
    &:active {
      background: #aa1111;
    }
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
`;

const modalBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const overlayFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: ${overlayFadeIn} 0.15s ease both;
`;

const ModalBox = styled.div`
  background: #0a0a0a;
  border: 2px solid #cc2222;
  padding: 24px 40px;
  font-family: "Pixelify Sans", monospace;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #cc2222;
  animation: ${scaleIn} 0.2s ease both, ${modalBlink} 0.8s ease 0.2s infinite;
`;
