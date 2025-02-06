import { useSliderState } from "react-stately";

import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useRef } from "react";
import { VisuallyHidden, mergeProps, useFocusRing, useNumberFormatter, useSlider, useSliderThumb } from "react-aria";
import { useAtomValue } from "jotai";
import { Palette } from "../../style/palette";
import { withDarkMode, type WithDarkMode } from "../../style/darkMode";
import { TRIANGLE } from "../../const";
import { bs } from "../../style";
import { InputContainer } from "./shared";
import { isDarkModeAtom } from "../../atoms/common";

const Container = styled(InputContainer)<{ orientation: "horizontal" | "vertical" }>`
  ${(p) => (p.orientation === "horizontal" ? "flex-direction: column;" : "height: 150px;")}
`;

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${bs(1 / 3)};
`;

const Track = styled.div<{ orientation: "horizontal" | "vertical"; disabled?: boolean } & WithDarkMode>(
  (p) => css`
    position: relative;
    ${p.orientation === "horizontal" ? "height: 30px; width: 100%;" : "width: 30px; height: 100%;"}
    ${p.disabled ? "opacity: 0.4;" : ""}
  :before {
      content: attr(x);
      display: block;
      position: absolute;
      background: ${Palette.black};

      height: 3px;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
    }
  `,
  (p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        :before {
          background: ${Palette.white};
        }
      `,
    ),
);

const ThumbComponent = styled.div<{ isFocusVisible?: boolean; isDragging?: boolean }>`
  width: 20px;
  height: 20px;
  :before {
    content: "${TRIANGLE}";
    font-size: ${bs(1 / 2)};
    display: block;
    position: absolute;
    bottom: -50%;
    left: 50%;
    transform: translate(-50%, -10%) rotate(180deg) scale(2);
  }
  ${(p) =>
    p.isDragging &&
    css`
      :before {
        color: dimgray;
      }
    `}
  ${(p) =>
    p.isFocusVisible &&
    css`
      :before {
        color: ${Palette.accent};
      }
    `}
`;

export function Slider(
  props: {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    name?: string;
    formatOptions?: Intl.NumberFormatOptions;
    orientation?: "horizontal" | "vertical";
  },
) {
  const trackRef = useRef(null);
  const numberFormatter = useNumberFormatter(props.formatOptions);
  const state = useSliderState({ ...props, numberFormatter });
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(props, state, trackRef);

  const orientation = props.orientation || "horizontal";

  const isDarkMode = useAtomValue(isDarkModeAtom);
  return (
    <Container orientation={orientation} {...groupProps}>
      {/* Create a container for the label and output element. */}
      {props.label && (
        <LabelContainer>
          <label {...labelProps}>{props.label}</label>
          <output {...outputProps}>{state.getThumbValueLabel(0)}</output>
        </LabelContainer>
      )}
      {/* The track element holds the visible track line and the thumb. */}
      <Track
        {...trackProps}
        ref={trackRef}
        orientation={orientation}
        disabled={state.isDisabled}
        isDarkMode={isDarkMode}
      >
        <Thumb index={0} state={state} trackRef={trackRef} name={props.name} />
      </Track>
    </Container>
  );
}

function Thumb(props) {
  const { state, trackRef, index, name } = props;
  const inputRef = useRef(null);
  const { thumbProps, inputProps, isDragging } = useSliderThumb(
    {
      index,
      trackRef,
      inputRef,
      name,
    },
    state,
  );

  const { focusProps, isFocusVisible } = useFocusRing();
  return (
    <ThumbComponent {...thumbProps} isDragging={isDragging} isFocusVisible={isFocusVisible}>
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
    </ThumbComponent>
  );
}
