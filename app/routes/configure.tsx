import { ActionFunctionArgs } from "@remix-run/node";
import { Form, json, useLoaderData, useSubmit } from "@remix-run/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { isDarkModeAtom } from "~/state/client";
import * as serverState from "~/state/server";

export const loader = async () => {
  const { store, isDarkModeAtom, tokenAtom } = serverState;
  const isDarkMode = store.get(isDarkModeAtom);
  const token = store.get(tokenAtom);
  return json({ isDarkMode, token });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { store, isDarkModeAtom, tokenAtom } = serverState;

  const body = await request.formData();
  const { isDarkMode, token } = { isDarkMode: body.get("isDarkMode") === "on", token: body.get("token") };
  store.set(isDarkModeAtom, isDarkMode);
  store.set(tokenAtom, token as string);

  return json({ result: "ok" });
};

export default function Configure() {
  const submit = useSubmit();
  const { isDarkMode, token } = useLoaderData<typeof loader>();

  const setDarkMode = useSetAtom(isDarkModeAtom);
  useEffect(() => {
    setDarkMode(isDarkMode);
  }, [isDarkMode]);

  return (
    <Form
      method="post"
      onChange={(e) => {
        submit(e.currentTarget);
      }}>
      <h2>Configure</h2>
      <h3>Visual</h3>
      <p>
        <label>
          <input type="checkbox" name="isDarkMode" defaultChecked={isDarkMode} />
          Enable dark mode
        </label>
      </p>
      <p></p>
      <h3>Inference</h3>
      <h4>Anthropic API token</h4>
      <p>Token is resolved from 1password by the backend, get the reference by clicking on arrow on the field.</p>
      <p>
        <input type="text" name="token" defaultValue={token} />
      </p>
    </Form>
  );
}
