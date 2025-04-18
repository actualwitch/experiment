import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useAtom } from "jotai";
import type { PropsWithChildren, RefObject } from "react";

import { isAnyPanelOpenAtom, layoutAtom, type WithLayout } from "../../atoms/common";
import { isDarkModeAtom } from "../../atoms/store";
import { bs } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { withOnMobile } from "../../style/layout";
import { Palette } from "../../style/palette";
import { increaseSpecificity } from "../../style/utils";

type WithSidemenuOpen = { isAnyPanelOpen?: boolean };

export const PageContainer = styled.div<WithDarkMode & WithLayout & WithSidemenuOpen>`
  display: flex;
  flex-direction: column;
  padding: ${bs()};
  position: relative;
  flex: 1;
  transition: transform 100ms ease-out;
  transform: scale(1);
  ${increaseSpecificity()} {
    overflow-x: hidden;
    overscroll-behavior-y: contain;
  }
  a {
    color: ${Palette.pink};
    text-decoration: underline;
    cursor: pointer;
    :hover {
      color: ${Palette.purple};
    }
  }
  ${(p) =>
    withOnMobile(
      p.layout,
      css`
        padding-top: 80px;
      `,
    )}
  ${(p) =>
    p.isAnyPanelOpen &&
    css`
      transform: scale(0.98);
      overflow-y: hidden;
    `}
`;

export const Page = ({ children, ...props }: PropsWithChildren<{ ref?: RefObject<HTMLDivElement | null> }>) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  const [isAnyPanelOpen] = useAtom(isAnyPanelOpenAtom);
  return (
    <PageContainer {...props} isDarkMode={isDarkMode} layout={layout} isAnyPanelOpen={isAnyPanelOpen}>
      {children}
    </PageContainer>
  );
};
