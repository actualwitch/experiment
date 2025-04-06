import { useRef } from "react";
import type { AriaTextFieldProps } from "react-aria";
import { useTextField } from "react-aria";
import styled from "@emotion/styled";
import { InputContainer } from "./shared";
import { withFormStyling, type FormProps } from "../../style/form";
import { BOTTTOM_OPTION } from "../../const";

const Input = styled.input<FormProps>(withFormStyling);

export function TextField({
  optional,
  placeholder = BOTTTOM_OPTION,
  ...props
}: AriaTextFieldProps & { optional?: boolean }) {
  const { label } = props;
  const ref = useRef(null);
  const { labelProps, inputProps, descriptionProps, errorMessageProps, isInvalid, validationErrors } = useTextField(
    props,
    ref,
  );

  return (
    <InputContainer>
      {label && (
        <label {...labelProps}>
          {label}
          {optional ? (
            <>
              {" "}
              <i>( optional )</i>
            </>
          ) : null}
        </label>
      )}
      <Input {...inputProps} placeholder={placeholder} ref={ref} />
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
