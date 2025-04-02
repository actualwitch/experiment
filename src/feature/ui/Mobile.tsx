import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { type PropsWithChildren, useEffect, useState } from "react";

import {
  desktopQuery,
  isActionPanelOpenAtom,
  isNavPanelOpenAtom,
  layoutAtom,
  mobileQuery,
  nopeAtom,
  type LayoutType,
} from "../../atoms/common";
import { isDarkModeAtom } from "../../atoms/store";
import { effectiveTitleAtom, iconAtom, routeAtom } from "../../feature/router";
import { Button, bs } from "../../style";
import { type WithDarkMode, withDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { Menu } from "lucide-react";
import { increaseSpecificity } from "../../style/utils";

export const MobileHeaderContainer = styled.h2<WithDarkMode>`
  position: absolute;
  cursor: pointer;
  left: ${bs(0.75)};
  top: 0;
  z-index: 1;
  user-select: none;

  padding: ${bs(1)} ${bs(1 / 2)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: calc(100vw - 52px);

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
  right: ${bs(3 / 4)};
  top: ${bs(3 / 4)};
  z-index: 3;
  margin-top: ${bs(1 / 6)};
`;

const MenuButton = styled.button<WithDarkMode>`
    position: relative;
    padding: ${bs(1 / 4)};

  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        color: white;
      `,
    )}
    ${increaseSpecificity()} {
      background: transparent;
      :hover {
        background: transparent;
      }
    }
    svg {
      margin-bottom: 0;a
    }
    span {
      font-size: 11px;
      position: absolute;
      right: 2px;
      top: 6px;
      text-shadow: none;
      border-radius: 100%;
      font-weight: 600;
    }
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
        {actions?.counter ? (
          <MenuButton
            isDarkMode={isDarkMode}
            onClick={() => {
              setIsActionPanelOpened(!isActionsPanelOpen);
            }}
          >
            <Menu size={32} />
            <span>{actions.counter}</span>
          </MenuButton>
        ) : null}
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
  const [staggeredLayout, setStaggeredLayout] = useState<LayoutType | undefined>(undefined);
  useEffect(() => {
    if (layout) {
      setStaggeredLayout(layout);
    }
  }, [layout]);
  if (!staggeredLayout) return <DesktopOnlyContainer>{children}</DesktopOnlyContainer>;
  return staggeredLayout === "desktop" ? children : null;
};

export const MobileOnlyContainer = styled.div`
  display: contents;
  @media ${desktopQuery} {
    display: none;
  }
`;

export const MobileOnly = ({ children }: PropsWithChildren) => {
  const [layout] = useAtom(layoutAtom);
  const [staggeredLayout, setStaggeredLayout] = useState<LayoutType | undefined>(undefined);
  useEffect(() => {
    if (layout) {
      setStaggeredLayout(layout);
    }
  }, [layout]);
  if (!staggeredLayout) return <MobileOnlyContainer>{children}</MobileOnlyContainer>;
  return staggeredLayout === "mobile" ? children : null;
};
