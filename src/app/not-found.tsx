"use client";

import styled, { keyframes } from "styled-components";
import PandaMascot from "@/components/PandaMascot";

export default function NotFound() {
  return (
    <Page>
      <Header>
        <Brand href="/">
          <PandaMascot />
          <BrandText>
            <WordMark>PANDAMIME</WordMark>
            <Tagline>find your closest Pantone® colors</Tagline>
          </BrandText>
        </Brand>
      </Header>

      <Content>
        <ErrorCode>404</ErrorCode>
        <ErrorTitle>PAGE NOT FOUND</ErrorTitle>
        <ErrorBody>
          The page you&apos;re looking for doesn&apos;t exist — or maybe it was
          a <Accent>color</Accent>{" "}we couldn&apos;t match.
        </ErrorBody>
        <BackLink href="/">← BACK TO PICKER</BackLink>
      </Content>

      <Footer>
        <FooterCopy>© {new Date().getFullYear()} Pandamime. All rights reserved.</FooterCopy>
      </Footer>
    </Page>
  );
}

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

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 2px solid #1a1a1a;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const Brand = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;

  @media (max-width: 480px) {
    gap: 10px;
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
  }
`;

const Content = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 64px 32px;
  animation: ${fadeInUp} 0.4s ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const glitch = keyframes`
  0%, 80%, 100% {
    transform: translate(0);
    text-shadow: 2px 2px 0 #cc2222, 4px 4px 0 #881111;
  }
  82% {
    transform: translate(-4px, 1px);
    text-shadow: 6px 2px 0 #cc2222, 2px 4px 0 #881111;
  }
  84% {
    transform: translate(4px, -1px);
    text-shadow: -2px 3px 0 #cc2222, 5px 5px 0 #881111;
  }
  86% {
    transform: translate(-2px, 2px);
    text-shadow: 4px 0 0 #ff0044, 2px 4px 0 #881111;
  }
  88% {
    transform: translate(0);
    text-shadow: 2px 2px 0 #cc2222, 4px 4px 0 #881111;
  }
`;

const ErrorCode = styled.p`
  font-family: "Pixelify Sans", monospace;
  font-size: 120px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  letter-spacing: 8px;
  text-shadow:
    2px 2px 0 #cc2222,
    4px 4px 0 #881111;
  animation: ${glitch} 4s ease-in-out infinite;

  @media (max-width: 480px) {
    font-size: 72px;
    letter-spacing: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ErrorTitle = styled.h1`
  font-family: "Pixelify Sans", monospace;
  font-size: 18px;
  font-weight: 700;
  color: #f5f5f0;
  letter-spacing: 2px;
`;

const ErrorBody = styled.p`
  font-size: 13px;
  color: #888;
  line-height: 1.8;
  text-align: center;
  max-width: 400px;
`;

const Accent = styled.em`
  font-style: normal;
  color: #cc2222;
`;

const BackLink = styled.a`
  font-family: "Pixelify Sans", monospace;
  font-size: 13px;
  color: #555;
  text-decoration: none;
  margin-top: 8px;
  &:hover {
    color: #cc2222;
  }
`;

const Footer = styled.footer`
  padding: 32px;
  border-top: 2px solid #1a1a1a;
  display: flex;
  justify-content: center;
`;

const FooterCopy = styled.p`
  font-family: "Pixelify Sans", monospace;
  font-size: 11px;
  font-weight: 400;
  color: #444;
  letter-spacing: 0.5px;
`;
