"use client";

import styled from "styled-components";

export default function Disclaimer() {
  return (
    <Wrapper>
      <Notice>
        <strong>NOT AFFILIATED WITH OR ENDORSED BY PANTONE LLC.</strong> This
        is an independent, unofficial tool. PANTONE® is a registered trademark
        of Pantone LLC. All Pantone® color names are trademarks of Pantone LLC
        and are used here solely for reference and identification purposes.
      </Notice>
      <Notice>
        <strong>DATASET NOTICE.</strong> The hex values in this dataset are
        independently derived approximations sampled from publicly visible
        Pantone® color chip images. They are <em>not</em> reproductions of
        Pantone&apos;s proprietary color data and may differ from official
        Pantone specifications. This dataset is provided for personal,
        educational, and non-commercial reference only.
      </Notice>
      <Notice>
        Color matches are approximate and must not be used as production
        specifications. Always verify against an official physical Pantone®
        swatch guide before production use.
      </Notice>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 640px;
`;

const Notice = styled.p`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #444;
  line-height: 1.7;
  margin: 0;

  strong {
    color: #666;
    font-weight: bold;
  }

  em {
    font-style: italic;
  }
`;
