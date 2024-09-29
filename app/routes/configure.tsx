import styled from "@emotion/styled";
import { Form } from "@remix-run/react";
import { useAtom } from "jotai";
import { createEntanglement, entangledResponse } from "~/again";
import { createController } from "~/createController";
import { createAction, createLoader } from "~/createLoader";
import { isDarkModeAtom, tokenAtom } from "~/state/common";
import { bs } from "~/style";
import { withFormStyling, type FormProps } from "~/style/form";

export { defaultMeta as meta } from "~/meta";

const atoms = { isDarkModeAtom };
export const loader = () => entangledResponse(atoms);
export const action = createAction(atoms);
const {useEntangledAtoms} = createEntanglement(atoms);

const Input = styled.input<FormProps>(withFormStyling);

const StyledForm = styled(Form)`
  display: flex;
  & > * {
    display: flex;
    gap: ${bs(1 / 2)};
  }
  flex-direction: column;
  input[type="text"] {
    flex: 1;
  }
  label {
    display: flex;
    align-items: baseline;
    margin-bottom: ${bs(1.5)};
  }
`;

export default function Configure() {
  useEntangledAtoms();
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  return (
    <>
      <StyledForm method="post">
        <h3>Visual</h3>
        <label>
          <input
            type="checkbox"
            name="isDarkMode"
            checked={isDarkMode}
            onChange={(e) => {
              setIsDarkMode(e.target.checked);
            }}
          />
          Enable dark mode
        </label>
        <h3>Inference</h3>
        <h4>Anthropic API token</h4>
        <p>Token is resolved from 1password by the backend, get the reference by clicking on arrow on the field.</p>
        {/* <label>
          <span>{hasResolvedToken ? "🔐" : "🔑"}</span>
          <Input
            _type={hasResolvedToken ? "success" : undefined}
            type="text"
            name="token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
            }}
          />
        </label> */}
      </StyledForm>
    </>
  );
}
