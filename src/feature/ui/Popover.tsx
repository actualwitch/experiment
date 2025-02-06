import type { OverlayTriggerState } from "react-stately";
import type { AriaPopoverProps } from "@react-aria/overlays";
import styled from "@emotion/styled";
import * as React from "react";
import { usePopover, DismissButton, Overlay } from "@react-aria/overlays";
import { Palette } from "../../style/palette";
import { bs } from "../../style";

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  state: OverlayTriggerState;
  popoverRef?: React.RefObject<HTMLDivElement>;
}

const Wrapper = styled.div`
  position: absolute;
  top: 100%;
  z-index: 1;
  width: 200px;
  overflow: hidden;
  border-radius: ${bs(Palette.borderCode)};
  margin-top: ${bs(1 / 2)};
  box-shadow: 2px 2px 8px ${Palette.buttonShadowDark}21;
  background: ${Palette.actionableBackground};
`;

export function Popover(props: PopoverProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, state, children, isNonModal } = props;

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
      <Wrapper {...popoverProps} ref={popoverRef}>
        {!isNonModal && <DismissButton onDismiss={state.close} />}
        {children}
        <DismissButton onDismiss={state.close} />
      </Wrapper>
    </Overlay>
  );
}
