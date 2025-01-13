import { type SerializedStyles, css } from "@emotion/react";
import { mobileQuery, type LayoutType } from "../atoms/common";

export const withOnMobile = (layout: LayoutType | undefined, style: SerializedStyles) => {
  if (layout === "mobile") {
    return style;
  }
  return css`
    @media ${mobileQuery} {
      ${style}
    }
  `;
};
