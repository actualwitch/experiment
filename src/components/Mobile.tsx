import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { css } from "@emotion/react";

import {
  desktopQuery,
  isActionPanelOpenAtom,
  isDarkModeAtom,
  isNavPanelOpenAtom,
  layoutAtom,
  mobileQuery,
} from "../state/common";
import { Button, bs } from "../style";
import { type WithDarkMode, withDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { iconAtom, titleAtom } from "../state/meta";
import type { PropsWithChildren } from "react";

export const MobileHeaderContainer = styled.h2<WithDarkMode>`
  position: absolute;
  cursor: pointer;
  left: ${bs()};
  top: ${bs()};
  z-index: 1;
  user-select: none;
  span {
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 4px;
    text-shadow:
      ${Palette.white} 1px 2px 14px,
      ${Palette.white} 0px 0px 24px;
  }
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        span {
          text-shadow:
            ${Palette.black} 1px 2px 14px,
            ${Palette.black} 0px 0px 24px;
        }
      `,
    )}
`;

export const MobileAction = styled.div`
  position: absolute;
  right: ${bs()};
  top: ${bs()};
  z-index: 3;
  margin-top: ${bs(1 / 6)};
`;

export const MobileHeader = () => {
  const [icon] = useAtom(iconAtom);
  const [title] = useAtom(titleAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isNavPanelOpen, setIsNavPanelOpened] = useAtom(isNavPanelOpenAtom);
  const [isActionsPanelOpen, setIsActionPanelOpened] = useAtom(isActionPanelOpenAtom);
  return (
    <>
      <MobileHeaderContainer
        isDarkMode={isDarkMode}
        onClick={() => {
          setIsNavPanelOpened(!isNavPanelOpen);
        }}
      >
        {icon} <span>{title}</span>
      </MobileHeaderContainer>
      <MobileAction>
        <Button
          onClick={() => {
            setIsActionPanelOpened(!isActionsPanelOpen);
          }}
        >
          ⍇
        </Button>
      </MobileAction>
    </>
  );
};

export const DesktopOnlyContainer = styled.div`
  @media ${mobileQuery} {
    display: none;
  }
`;

export const DesktopOnly = ({ children }: PropsWithChildren) => {
  const [layout] = useAtom(layoutAtom);
  if (!layout) return <DesktopOnlyContainer>{children}</DesktopOnlyContainer>;
  return layout === "desktop" ? children : null;
};

export const MobileOnlyContainer = styled.div`
  @media ${desktopQuery} {
    display: none;
  }
`;

export const MobileOnly = ({ children }: PropsWithChildren) => {
  const [layout] = useAtom(layoutAtom);
  if (!layout) return <MobileOnlyContainer>{children}</MobileOnlyContainer>;
  return layout === "mobile" ? children : null;
};
