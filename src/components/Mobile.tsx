import styled from "@emotion/styled";
import { useAtom, useAtomValue } from "jotai";

import { css } from "@emotion/react";
import { isActionPanelOpenAtom, isDarkModeAtom, isNavPanelOpenAtom, layoutAtom, mobileQuery } from "../state/common";
import { Button, bs } from "../style";
import { type WithDarkMode, withDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { iconAtom, titleAtom } from "../state/meta";

export const MobileHeaderContainer = styled.h2<WithDarkMode>`
  position: absolute;
  left: ${bs()};
  top: ${bs()};
  z-index: 1;
  user-select: none;
  span {
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 4px;
    padding: 0 ${bs(0.5)};
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
  const layout = useAtomValue(layoutAtom);
  if (layout !== "mobile") return null;
  return (
    <>
      <MobileHeaderContainer
        isDarkMode={isDarkMode}
        onClick={() => {
          setIsNavPanelOpened(!isNavPanelOpen);
        }}
      >
        {icon}
        <span>{title}</span>
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

export const DesktopOnly = styled.div`
  @media ${mobileQuery} {
    display: none;
  }
`;