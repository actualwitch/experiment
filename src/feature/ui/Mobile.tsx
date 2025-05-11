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
import { BlurredFocus } from "./BlurredFocus";

export const MobileHeaderContainer = styled.h2<WithDarkMode>`
  position: absolute;
  cursor: pointer;
  left: ${bs(1 / 4)};
  top: ${bs()};
  z-index: 1;
  user-select: none;

  span {
    text-decoration: underline;
    text-decoration-thickness: auto;
    text-underline-offset: 4px;
  }

  & > div {
    padding: 0 ${bs(3 / 2)} ${bs(1 / 2)} ${bs()};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: calc(100vw - 22px);
  }

  text-shadow:
    ${Palette.white}50 -1px -1px 1px,
    ${Palette.white}50 1px 1px 1px;
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        text-shadow:
          ${Palette.black}50 -1px -1px 1px,
          ${Palette.black}50 1px 1px 1px;
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

  svg {
    filter: drop-shadow(-1px -1px 1px ${Palette.white}50) drop-shadow(1px 1px 1px ${Palette.white}50);
  }

  text-shadow:
    ${Palette.white}50 -1px -1px 1px,
    ${Palette.white}50 1px 1px 1px;

  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        color: white;
        text-shadow:
          ${Palette.black}50 -1px -1px 1px,
          ${Palette.black}50 1px 1px 1px;

        svg {
          filter: drop-shadow(-1px -1px 1px ${Palette.black}50) drop-shadow(1px 1px 1px ${Palette.black}50);
        }
      `,
    )}
  ${increaseSpecificity()} {
    background: transparent;
    :hover {
      background: transparent;
    }
  }
  svg {
    margin-bottom: 0;
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
  const [actions] = useAtom(route?.actions ?? nopeAtom);
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
        <BlurredFocus>
          {icon} <span>{title}</span>
        </BlurredFocus>
        {/* <BlurredFocus isDarkMode={isDarkMode}>
          {icon} <span>{title}</span>
        </BlurredFocus> */}
      </MobileHeaderContainer>
      <MobileAction>
        {actions?.counter ? (
          <BlurredFocus>
            <MenuButton
              isDarkMode={isDarkMode}
              onClick={() => {
                setIsActionPanelOpened(!isActionsPanelOpen);
              }}
            >
              <Menu size={32} />
              <span>{actions.counter}</span>
            </MenuButton>
          </BlurredFocus>
        ) : null}
      </MobileAction>
    </>
  );
};

export const DesktopOnlyBlurredFocus = styled.div`
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
  if (!staggeredLayout) return <DesktopOnlyBlurredFocus>{children}</DesktopOnlyBlurredFocus>;
  return staggeredLayout === "desktop" ? children : null;
};

export const MobileOnlyBlurredFocus = styled.div`
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
  if (!staggeredLayout) return <MobileOnlyBlurredFocus>{children}</MobileOnlyBlurredFocus>;
  return staggeredLayout === "mobile" ? children : null;
};
