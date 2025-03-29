import { useRef, type PropsWithChildren } from "react";
import { mergeProps, useCheckbox, useFocusRing, VisuallyHidden } from "react-aria";
import { useToggleState } from "react-stately";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import type { WithDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { bs } from "../../style";
import { useAtom } from "jotai";
import { isDarkModeAtom } from "../../atoms/store";

const CheckboxContainer = styled.label<{ isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${bs(1 / 2)};
  cursor: pointer;
  user-select: none;
`;

const CheckboxSvg = styled.svg<WithDarkMode & { isFocused?: boolean; isSelected?: boolean }>`
  width: 28px;
  height: 28px;
  transition: all 0.2s ease-out;
  fill-rule: evenodd;
  clip-rule: evenodd;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-miterlimit: 1;
  transform: translate(0, 0);

  path {
    fill: ${(props) =>
      props.isSelected
        ? props.isDarkMode
          ? Palette.actionableBackground
          : Palette.actionableBackground
        : "transparent"};
    stroke: ${(props) => (props.isDarkMode ? Palette.actionableBackground : Palette.actionableBackground)};
    transition: fill 0.3s ease-out;
  }

  &:hover {
    transform: translate(0, -1px);
    path {
      stroke: ${Palette.buttonHoverBackground};
      fill: ${Palette.buttonHoverBackground};
    }
  }
`;

export function Checkbox(
  props: PropsWithChildren<{
    isIndeterminate?: boolean;
    isDisabled?: boolean;
    checked?: boolean;
    setValue?: (newValue: boolean) => void;
  }>,
) {
  const state = useToggleState(props);
  const ref = useRef(null);
  const { inputProps } = useCheckbox(props, state, ref);
  const { isFocusVisible, focusProps } = useFocusRing();
  const isSelected = state.isSelected && !props.isIndeterminate;
  const [isDarkMode] = useAtom(isDarkModeAtom);

  return (
    <CheckboxContainer isDisabled={props.isDisabled}>
      <VisuallyHidden>
        <input {...mergeProps(inputProps, focusProps)} ref={ref} />
      </VisuallyHidden>
      <CheckboxSvg
        viewBox="0 0 756 756"
        xmlSpace="preserve"
        isDarkMode={isDarkMode}
        isFocused={isFocusVisible}
        isSelected={isSelected}
      >
        <title>Checkbox: {isSelected ? "checked" : "unchecked"}</title>
        <g transform="matrix(3.37686,0,0,2.54996,-913.271,-472.243)">
          <path
            d="M382.479,211.809L480.198,451.884L284.759,451.884L382.479,211.809Z"
            style={{
              strokeWidth: 14,
            }}
          />
        </g>
      </CheckboxSvg>
      {props.children}
    </CheckboxContainer>
  );
}
