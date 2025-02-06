import { css } from "@emotion/react";
import type { HTMLAttributes } from "react";

import { bs } from ".";
import { Palette } from "./palette";

type FormProps = { _type?: "success" };

const shared = css`
  padding: ${bs(1 / 5)} ${bs(1 / 2)};
  border: none;
  border-radius: ${Palette.borderCode};
`;
const success = css`
  background-color: ${Palette.successGreen};
`;

const withFormStyling = ({ _type }: FormProps & HTMLAttributes<HTMLInputElement>) => {
  if (_type === "success") {
    return [shared, success];
  }
  return shared;
};

export { withFormStyling };
export type { FormProps };
