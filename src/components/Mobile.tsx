import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue } from "jotai";

import { isActionPanelOpenAtom, isNavPanelOpenAtom, layoutAtom } from "../state/common";
import { iconAtom } from "../state/meta";
import { bs, Button } from "../style";
import { useState } from "react";

export const MobileHeaderContainer = styled.h2`
  position: absolute;
  left: ${bs()};
  top: ${bs()};
  z-index: 1;
  span {
    text-decoration: underline;
    padding: 0 ${bs(0.5)};
    text-shadow:
      black 1px 2px 14px,
      black 0px 0px 24px;
  }
`;

export const MobileAction = styled.div`
  position: absolute;
  right: ${bs()};
  top: ${bs()};
  z-index: 3;
  margin-top: ${bs(1 / 6)};
`;

export const MobileHeader = () => {
  const [isNavPanelOpen, setIsNavPanelOpened] = useAtom(isNavPanelOpenAtom);
  const [isActionsPanelOpen, setIsActionPanelOpened] = useAtom(isActionPanelOpenAtom);
  const layout = useAtomValue(layoutAtom);
  if (layout !== "mobile") return null;
  return (
    <>
      <MobileHeaderContainer
        onClick={() => {
          setIsNavPanelOpened(!isNavPanelOpen);
        }}
      >
        🔬 
        <span>Experiment</span>
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
