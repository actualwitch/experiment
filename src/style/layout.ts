import { type SerializedStyles, css } from "@emotion/react";
import { mobileQuery, type LayoutType } from "../state/common";

export const withOnMobile = (layout: LayoutType, style: SerializedStyles) => {
  if (layout === "desktop") {
    return css`
      @media ${mobileQuery} {
        ${style}
      }
    `;
  }
  return style;
};
