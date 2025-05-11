import { css } from "@emotion/react";
import { Palette } from "../../../style/palette";

export const inlineButtonModifier = css`
  background-color: transparent;
  color: inherit;
  padding-top: 0;
  padding-bottom: 0;
  :hover {
    background-color: ${Palette.black}20;
  }
`;
