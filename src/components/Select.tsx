import styled from "@emotion/styled";
import type { AriaSelectProps } from "@react-types/select";
import * as React from "react";
import { HiddenSelect, mergeProps, useButton, useFocusRing, useSelect } from "react-aria";
import { useSelectState } from "react-stately";

import { ListBox } from "./ListBox";
import { Popover } from "./Popover";
import { Label, InputContainer } from "./shared";
import { TRIANGLE } from "../const";

interface ButtonProps {
  isOpen?: boolean;
  isFocusVisible?: boolean;
}

const Button = styled.button<ButtonProps>`
  appearance: none;
  background: ${(props) => (props.isOpen ? "#eee" : "white")};
  border: 1px solid;
  padding: 6px 2px 6px 8px;
  outline: none;
  border-color: ${(props) => (props.isFocusVisible ? "seagreen" : "lightgray")};
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  text-align: left;
  font-size: 14px;
  color: black;
`;

const Value = styled.span`
  display: inline-flex;
  align-items: center;
`;

export function Select<T extends object>(props: AriaSelectProps<T>) {
  // Create state based on the incoming props
  const state = useSelectState(props);

  // Get props for child elements from useSelect
  const ref = React.useRef(null);
  const { labelProps, triggerProps, valueProps, menuProps } = useSelect(props, state, ref);

  // Get props for the button based on the trigger props from useSelect
  const { buttonProps } = useButton(triggerProps, ref);

  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <InputContainer>
      {props.label ?
        <Label {...labelProps}>{props.label}</Label>
      : null}
      <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />
      <Button {...mergeProps(buttonProps, focusProps)} ref={ref} isOpen={state.isOpen} isFocusVisible={isFocusVisible}>
        <Value {...valueProps}>{state.selectedItem ? state.selectedItem.rendered : "Select an option"}</Value>
        {/* <span>{TRIANGLE}</span> */}
      </Button>
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <ListBox {...menuProps} state={state} />
        </Popover>
      )}
    </InputContainer>
  );
}
