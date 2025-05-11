import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { WithDarkMode } from "../../style/darkMode";
import type { PropsWithChildren } from "react";
import { useAtom } from "jotai";
import { isDarkModeAtom } from "../../atoms/store";

// export const BlurredFocus = styled.div<WithDarkMode>`
//   position: relative;

//   ::before {
//     content: "";
//     position: absolute;
//     z-index: -1;
//     top: 0;
//     bottom: 0;
//     left: 0;
//     right: 0;

//     mask: radial-gradient(
//       ellipse at center,
//       rgb(255, 255, 255),
//       rgb(255, 255, 255) 56%,
//       rgba(255, 255, 255, 0.2) 74%,
//       rgba(255, 255, 255, 0) 100%
//     );

//     ${(p) =>
//       p.isDarkMode
//         ? css`
//           backdrop-filter: blur(1px) brightness(1.1);
//         `
//         : css`
//           backdrop-filter: blur(1px);
//         `}
//   }
// `;

export const Container = styled.div`
  position: relative;
`;

export const BlurLayer = styled.div<WithDarkMode & { level: 1 | 2 }>`
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  ${(p) => {
    if (p.level === 1) {
      return css`
        mask: radial-gradient(
          ellipse at center,
          rgba(255, 255, 255, 0) 55%,
          rgb(255, 255, 255) 56%,
          rgb(255, 255, 255) 57%,
          rgba(255, 255, 255, 0) 100%
        );
      `;
    }
    if (p.level === 2) {
      return css`
        mask: radial-gradient(ellipse at center, rgb(255, 255, 255, 1) 54%, rgba(255, 255, 255, 0) 71%);
      `;
    }
  }};

  ${(p) => {
    const radius = p.level === 1 ? 1 : 2;
    return p.isDarkMode
      ? css`
          backdrop-filter: blur(${radius}px) brightness(1.1);
        `
      : css`
          backdrop-filter: blur(${radius}px);
        `;
  }}
`;

export const BlurredFocus = ({ children }: PropsWithChildren) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  return (
    <Container>
      {children}
      <BlurLayer isDarkMode={isDarkMode} level={1} />
      <BlurLayer isDarkMode={isDarkMode} level={2} />
    </Container>
  );
};
