import { css, type SerializedStyles } from "@emotion/react";

export const withDarkMode = (isDarkMode: boolean | undefined, style: SerializedStyles) => {
  if (isDarkMode === undefined) {
    return css`
      @media (prefers-color-scheme: dark) {
        ${style}
      }
    `;
  }
  return isDarkMode ? style : css``;
};