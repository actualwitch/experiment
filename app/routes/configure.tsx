import { ActionFunctionArgs } from "@remix-run/node";
import { Form, json, useLoaderData, useSubmit } from "@remix-run/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { isDarkModeAtom } from "~/state/client";
import * as serverState from "~/state/server";
import { bs } from "~/style";
import { withFormStyling, type FormProps } from "~/style/form";
import styled from "@emotion/styled";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  const { store, isDarkModeAtom, tokenAtom, hasResolvedTokenAtom } = serverState;
  const isDarkMode = store.get(isDarkModeAtom);
  const token = store.get(tokenAtom);
  const hasResolvedToken = await store.get(hasResolvedTokenAtom);
  return json({ isDarkMode, token, hasResolvedToken });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { store, isDarkModeAtom, tokenAtom } = serverState;

  const body = await request.formData();
  const { isDarkMode, token } = { isDarkMode: body.get("isDarkMode") === "on", token: body.get("token") };
  store.set(isDarkModeAtom, isDarkMode);
  store.set(tokenAtom, token as string);

  return json({ result: "ok" });
};

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
  const submit = useSubmit();
  const { isDarkMode, token, hasResolvedToken } = useLoaderData<typeof loader>();

  const setDarkMode = useSetAtom(isDarkModeAtom);
  useEffect(() => {
    setDarkMode(isDarkMode);
  }, [isDarkMode]);

  return (
    <StyledForm
      method="post"
      onChange={(e) => {
        submit(e.currentTarget);
      }}>
      <h3>Visual</h3>
      <label>
        <input type="checkbox" name="isDarkMode" defaultChecked={isDarkMode} />
        Enable dark mode
      </label>
      <h3>Inference</h3>
      <h4>Anthropic API token</h4>
      <p>Token is resolved from 1password by the backend, get the reference by clicking on arrow on the field.</p>
      <label>
        <span>{hasResolvedToken ? "🔐" : "🔑"}</span>
        <Input _type={hasResolvedToken ? "success" : undefined} type="text" name="token" defaultValue={token} />
      </label>
    </StyledForm>
  );
}
