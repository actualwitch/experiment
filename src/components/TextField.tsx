import { useRef } from "react";
import type { AriaTextFieldProps } from "react-aria";
import { useTextField } from "react-aria";
import styled from "@emotion/styled";
import { withFormStyling, type FormProps } from "../style/form";
import { InputContainer } from "./shared";

const Input = styled.input<FormProps>(withFormStyling);

export function TextField(props: AriaTextFieldProps) {
  const { label } = props;
  const ref = useRef(null);
  const { labelProps, inputProps, descriptionProps, errorMessageProps, isInvalid, validationErrors } = useTextField(
    props,
    ref,
  );

  return (
    <InputContainer>
      {label && <label {...labelProps}>{label}</label>}
      <Input {...inputProps} ref={ref} />
      {props.description && (
        <div {...descriptionProps} style={{ fontSize: 12 }}>
          {props.description}
        </div>
      )}
      {isInvalid && (
        <div {...errorMessageProps} style={{ color: "red", fontSize: 12 }}>
          {validationErrors.join(" ")}
        </div>
      )}
    </InputContainer>
  );
}
