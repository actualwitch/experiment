import type { OverlayTriggerState } from "react-stately";
import type { AriaPopoverProps } from "@react-aria/overlays";
import styled from "@emotion/styled";
import * as React from "react";
import { usePopover, DismissButton, Overlay } from "@react-aria/overlays";
import { Palette } from "../../style/palette";
import { bs, shadows } from "../../style";
import { withDarkMode, type WithDarkMode } from "../../style/darkMode";
import { useAtom } from "jotai";
import { isDarkModeAtom } from "../../atoms/store";
import { css } from "@emotion/react";
import type { WithTransitionState } from "../transitionState";

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  state: OverlayTriggerState;
  popoverRef?: React.RefObject<HTMLDivElement>;
}

const Wrapper = styled.div<WithDarkMode & WithTransitionState>`
  position: absolute;
  top: 100%;
  z-index: 1;
  width: 200px;
  overflow: hidden;
  border-radius: ${bs(Palette.borderCode)};
  margin-top: ${bs(1 / 2)};
  background: ${Palette.actionableBackground};
  box-shadow: ${shadows.dark};
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        box-shadow: ${shadows.lighter};
      `,
    )}
  opacity: 0;
  transition: ${["transform", "opacity", "filter"].map((prop) => `${prop} 100ms ease-in-out`).join(", ")};
  transform: translateY(32px);
  filter: blur(10px);
  ${({ transitionState }) => {
    if (transitionState === "entered") {
      return css`
        transform: translateY(0);
        filter: blur(0px);
        opacity: 1;
      `;
    }
    if (transitionState === "exiting") {
      return css``;
    }
    if (transitionState === "entering") {
      return css`
        transform: translateY(0);
        filter: blur(0px);
        opacity: 1;
      `;
    }
  }}
`;

export function Popover({ transitionState, ...props }: PopoverProps & WithTransitionState) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, state, children, isNonModal } = props;
  const [isDarkMode] = useAtom(isDarkModeAtom);

  const { popoverProps, underlayProps } = usePopover(
    {
      ...props,
      popoverRef,
    },
    state,
  );

  return (
    <Overlay>
      {!isNonModal && <div {...underlayProps} style={{ position: "fixed", inset: 0 }} />}
      <Wrapper {...popoverProps} ref={popoverRef} isDarkMode={isDarkMode} transitionState={transitionState}>
        {!isNonModal && <DismissButton onDismiss={state.close} />}
        {children}
        <DismissButton onDismiss={state.close} />
      </Wrapper>
    </Overlay>
  );
}
