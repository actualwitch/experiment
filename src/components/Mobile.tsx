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
} from "../atoms/common";
import { Button, bs } from "../style";
import { type WithDarkMode, withDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { useEffect, useMemo, type PropsWithChildren } from "react";
import { iconAtom, effectiveTitleAtom, routeAtom } from "../feature/router";
import { nopeAtom } from "../atoms/util";

export const MobileHeaderContainer = styled.h2<WithDarkMode>`
  position: absolute;
  cursor: pointer;
  left: ${bs()};
  top: ${bs()};
  z-index: 1;
  user-select: none;
  span {
    text-decoration: underline;
    text-decoration-thickness: auto;
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
  const [title] = useAtom(effectiveTitleAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isNavPanelOpen, setIsNavPanelOpened] = useAtom(isNavPanelOpenAtom);
  const [isActionsPanelOpen, setIsActionPanelOpened] = useAtom(isActionPanelOpenAtom);
  const [route] = useAtom(routeAtom);
  const [actions] = useAtom(route?.sidebar?.atom ?? nopeAtom);
  useEffect(() => {
    if (isActionsPanelOpen && actions?.counter === 0) {
      setIsActionPanelOpened(false);
    }
  }, [isActionsPanelOpen, actions]);
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
        {actions?.counter ?
          <Button
            onClick={() => {
              setIsActionPanelOpened(!isActionsPanelOpen);
            }}
          >
            {actions.counter}
          </Button>
        : null}
      </MobileAction>
    </>
  );
};

export const DesktopOnlyContainer = styled.div`
  display: contents;
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
  display: contents;
  @media ${desktopQuery} {
    display: none;
  }
`;

export const MobileOnly = ({ children }: PropsWithChildren) => {
  const [layout] = useAtom(layoutAtom);
  if (!layout) return <MobileOnlyContainer>{children}</MobileOnlyContainer>;
  return layout === "mobile" ? children : null;
};
