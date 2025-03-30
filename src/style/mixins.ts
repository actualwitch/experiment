import { css } from "@emotion/react";

export const interactive = css`
  cursor: pointer;
`;

export const nonInteractive = css`
  pointer-events: none;
  user-select: none;
`;

export const widthAvailable = css`
  width: -moz-available;
  width: -webkit-fill-available;
`;

export const widthLimit = css`
  max-width: 80ch;
`;
