"use client";

// Full-screen splash shown on first paint. It's rendered in the initial
// (prerendered) markup so it appears instantly on refresh — no flash of the
// bare page — then fades out once the app has mounted. Kept mounted but inert
// while hidden so the fade can play; aria-hidden so it leaves the a11y tree.

import styled, { keyframes } from "styled-components";
import PandaMascot from "./PandaMascot";

export default function LoadingScreen({ hidden }: { hidden: boolean }) {
  return (
    <Overlay $hidden={hidden} aria-hidden={hidden}>
      <Inner>
        <PandaWrap>
          <PandaMascot width={200} />
        </PandaWrap>
        <WordMark>PANDAMIME</WordMark>
        <BarTrack>
          <BarFill />
        </BarTrack>
        <LoadingText>LOADING</LoadingText>
        <Samsodium>samsodium</Samsodium>
      </Inner>
    </Overlay>
  );
}

const Overlay = styled.div<{ $hidden: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.45s ease, visibility 0.45s ease;
  opacity: ${(p) => (p.$hidden ? 0 : 1)};
  visibility: ${(p) => (p.$hidden ? "hidden" : "visible")};
  pointer-events: ${(p) => (p.$hidden ? "none" : "auto")};
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const PandaWrap = styled.div`
  line-height: 0;
  animation: ${bob} 1.4s ease-in-out infinite;
  & > svg {
    width: 96px;
    height: 120px;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const WordMark = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 28px;
  font-weight: 700;
  color: #f5f5f0;
  letter-spacing: 3px;
`;

const BarTrack = styled.div`
  width: 200px;
  height: 14px;
  border: 2px solid #2a2a2a;
  overflow: hidden;
  /* Clip the sweeping fill to crisp pixel edges. */
  image-rendering: pixelated;
`;

// Indeterminate sweep — a fixed chunk steps across the track on a loop.
const sweep = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(366%); }
`;

const BarFill = styled.div`
  width: 30%;
  height: 100%;
  background: #cc2222;
  animation: ${sweep} 1s steps(8) infinite;
  @media (prefers-reduced-motion: reduce) {
    /* Show a static partial fill rather than an empty bar. */
    transform: none;
    width: 60%;
    animation: none;
  }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const LoadingText = styled.span`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  font-weight: 400;
  color: #666;
  letter-spacing: 2px;
  animation: ${blink} 1.2s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Samsodium = styled.div`
  display: flex;
  justify-content: end;
  height: 100%;
  font-family: "Pixelify Sans",monospace;
  font-size: 10px;
`;
