"use client";

import styled from "styled-components";
import Disclaimer from "@/components/Disclaimer";
import PandaMascot from "@/components/PandaMascot";

export default function About() {
  return (
    <Page>
      <Header>
        <Brand href="/">
          <PandaMascot />
          <WordMark>PANTOMIME</WordMark>
        </Brand>
      </Header>

      <Content>
        <Title>METHODOLOGY</Title>

        <Section>
          <SectionTitle>HOW THE DATASET WAS BUILT</SectionTitle>
          <Body>
            The color data comes from publicly visible Pantone® color chip images
            (cotton TCX, paper TPG, and polyester TSX fashion books). A Python
            script swept the RGB cube, queried Pantone&apos;s color-finder to collect
            named color codes, then downloaded each chip image and sampled the
            center pixel to derive a hex value. Those hex values are{" "}
            <Strong>self-sampled approximations</Strong> — not official Pantone
            data. Cotton and paper entries that share the same numbering system
            are merged into a single record; polyester remains separate.
          </Body>
          <Body>
            The dataset covers 1,900+ named fashion colors across three books.
            It can be regenerated at any time by running{" "}
            <Code>collect_pantone.py</Code> (included in the repository).
          </Body>
        </Section>

        <Section>
          <SectionTitle>HOW MATCHING WORKS</SectionTitle>
          <Body>
            When you pick a color, Pantomime converts it — and every color in the
            dataset — into <Strong>CIELAB color space</Strong>, which approximates
            human perceptual distance. It then ranks all dataset colors by{" "}
            <Strong>CIEDE2000 (ΔE)</Strong>, the industry-standard metric for
            perceptual color difference.
          </Body>
          <Body>
            This matters: two colors that look similar to a human can be far apart
            in raw RGB. Lab + CIEDE2000 measures what your eye actually sees, not
            what the numbers say.
          </Body>
          <DeltaTable>
            <DeltaRow>
              <DeltaRange>ΔE &lt; 2</DeltaRange>
              <DeltaLabel $color="#22cc66">very close — imperceptible to most eyes</DeltaLabel>
            </DeltaRow>
            <DeltaRow>
              <DeltaRange>ΔE 2–5</DeltaRange>
              <DeltaLabel $color="#88cc22">close — noticeable on direct comparison</DeltaLabel>
            </DeltaRow>
            <DeltaRow>
              <DeltaRange>ΔE 5–10</DeltaRange>
              <DeltaLabel $color="#cc8822">loose — clearly different colors</DeltaLabel>
            </DeltaRow>
            <DeltaRow>
              <DeltaRange>ΔE &gt; 10</DeltaRange>
              <DeltaLabel $color="#cc2222">nearest available — no close match exists</DeltaLabel>
            </DeltaRow>
          </DeltaTable>
        </Section>

        <Section>
          <SectionTitle>IMPORTANT LIMITATIONS</SectionTitle>
          <Body>
            Screen color ≠ printed spot ink. Pantone® colors are physical
            standardized inks; what you see on a monitor is an RGB approximation
            that varies by display calibration, profile, and ambient light. No
            software tool can give you a print-accurate match — only an official
            Pantone physical swatch can do that.
          </Body>
          <Body>
            The hex values in this dataset were sampled from displayed chip images,
            not measured from physical ink samples. Treat all results as a
            starting point for conversation with a print vendor or designer, not
            as a production specification.
          </Body>
        </Section>

        <DisclaimerBox>
          <DisclaimerTitle>LEGAL NOTICE</DisclaimerTitle>
          <Disclaimer />
        </DisclaimerBox>

        <BackLink href="/">← BACK TO PICKER</BackLink>
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  padding: 20px 32px;
  border-bottom: 2px solid #1a1a1a;
`;

const Brand = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
`;

const WordMark = styled.span`
  font-family: "Press Start 2P", monospace;
  font-size: 16px;
  color: #f5f5f0;
  letter-spacing: 2px;
`;

const Content = styled.main`
  max-width: 680px;
  margin: 0 auto;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  gap: 48px;
`;

const Title = styled.h1`
  font-family: "Press Start 2P", monospace;
  font-size: 14px;
  color: #f5f5f0;
  letter-spacing: 2px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  font-family: "Press Start 2P", monospace;
  font-size: 9px;
  color: #cc2222;
  letter-spacing: 1px;
`;

const Body = styled.p`
  font-size: 13px;
  color: #888;
  line-height: 1.9;
`;

const Strong = styled.strong`
  color: #bbb;
  font-weight: normal;
`;

const Code = styled.code`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #cc2222;
  background: #1a1a1a;
  padding: 1px 4px;
`;

const DeltaTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #111;
  border-left: 2px solid #cc2222;
`;

const DeltaRow = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  align-items: baseline;
`;

const DeltaRange = styled.span`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #555;
`;

const DeltaLabel = styled.span<{ $color: string }>`
  font-size: 12px;
  color: ${(p) => p.$color};
`;

const DisclaimerBox = styled.div`
  padding: 20px;
  background: #111;
  border: 2px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DisclaimerTitle = styled.h3`
  font-family: "Press Start 2P", monospace;
  font-size: 8px;
  color: #444;
  letter-spacing: 1px;
`;

const BackLink = styled.a`
  font-family: "Press Start 2P", monospace;
  font-size: 8px;
  color: #555;
  text-decoration: none;
  &:hover {
    color: #cc2222;
  }
`;
