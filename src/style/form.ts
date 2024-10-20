import { css } from "@emotion/react";
import { type HTMLAttributes } from "react";
import { bs } from ".";

type FormProps = { _type?: "success" };

const shared = css`
  padding: ${bs(1 / 5)} ${bs(1 / 2)};
  border: none;
  border-radius: 4px;
`;
const success = css`
  background-color: color(display-p3 0.372 0.903 0.775 / 1);
`;

const withFormStyling = ({ _type }: FormProps & HTMLAttributes<HTMLInputElement>) => {
  if (_type === "success") {
    return [shared, success];
  }
  return shared;
};

export { withFormStyling };
export type { FormProps };
