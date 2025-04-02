import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useAtom } from "jotai";
import type { PropsWithChildren, RefObject } from "react";

import { isActionPanelOpenAtom, isNavPanelOpenAtom, layoutAtom, type WithLayout } from "../../atoms/common";
import { isDarkModeAtom } from "../../atoms/store";
import { bs } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { withOnMobile } from "../../style/layout";
import { Palette } from "../../style/palette";
import { increaseSpecificity } from "../../style/utils";

type WithSidemenuOpen = { isSidemenuOpen?: boolean };

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
    p.isSidemenuOpen &&
    css`
      transform: scale(0.98);
    `}
`;

export const Page = ({ children, ...props }: PropsWithChildren<{ ref?: RefObject<HTMLDivElement | null> }>) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  const [isNavPanelOpen, setIsNavPanelOpen] = useAtom(isNavPanelOpenAtom);
  const [isActionPanelOpen, setIsActionPanelOpen] = useAtom(isActionPanelOpenAtom);
  return (
    <PageContainer
      {...props}
      isDarkMode={isDarkMode}
      layout={layout}
      isSidemenuOpen={isNavPanelOpen || isActionPanelOpen}
    >
      {children}
    </PageContainer>
  );
};
