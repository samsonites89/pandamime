"use client";

import styled from "styled-components";

export default function Disclaimer() {
  return (
    <Notice>
      Not affiliated with or endorsed by Pantone LLC. PANTONE® is a registered
      trademark of Pantone LLC. Color matches are approximate and for reference
      only — verify against an official Pantone guide before production use.
    </Notice>
  );
}

const Notice = styled.p`
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #444;
  line-height: 1.7;
  margin: 0;
  max-width: 640px;
`;
