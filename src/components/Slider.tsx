import { useSliderState } from "react-stately";

import { VisuallyHidden, mergeProps, useFocusRing, useNumberFormatter, useSlider, useSliderThumb } from "react-aria";
import { useRef } from "react";
import styled from "@emotion/styled";

const Container = styled.div<{ orientation: "horizontal" | "vertical" }>`
  display: flex;
  ${(p) => (p.orientation === "horizontal" ? "flex-direction: column; width: 300px;" : "height: 150px;")}
`;

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Track = styled.div<{ orientation: "horizontal" | "vertical"; disabled?: boolean }>`
  position: relative;
  ${(p) => (p.orientation === "horizontal" ? "height: 30px; width: 100%;" : "width: 30px; height: 100%;")}
  ${(p) => (p.disabled ? "opacity: 0.4;" : "")}
  :before {
    content: attr(x);
    display: block;
    position: absolute;
    background: gray;

    height: 3px;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const ThumbComponent = styled.div<{ isFocusVisible?: boolean; isDragging?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: gray;
  ${(p) => (p.isDragging ? "background: dimgray;" : "")}
  ${(p) => (p.isFocusVisible ? "background: orange;" : "")}
`;

export function Slider(props: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  name?: string;
  formatOptions?: Intl.NumberFormatOptions;
  orientation?: "horizontal" | "vertical";
}) {
  const trackRef = useRef(null);
  const numberFormatter = useNumberFormatter(props.formatOptions);
  const state = useSliderState({ ...props, numberFormatter });
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(props, state, trackRef);

  const orientation = props.orientation || "horizontal";

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
      <Track {...trackProps} ref={trackRef} orientation={orientation} disabled={state.isDisabled}>
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
