import { css, type SerializedStyles } from "@emotion/react";

export type WithDarkMode = {
  isDarkMode: boolean | undefined;
};

export const nope = css``;

export const withDarkMode = (isDarkMode: boolean | undefined, style: SerializedStyles) => {
  if (isDarkMode === undefined) {
    return css`
      @media (prefers-color-scheme: dark) {
        ${style}
      }
    `;
  }
  return isDarkMode ? style : nope;
};
