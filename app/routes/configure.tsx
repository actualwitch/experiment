import { json, useLoaderData } from "@remix-run/react";
import { useAtom } from "jotai";
import { useTransition } from "react";
import { isDarkModeAtom } from "~/state/client";
import { store, tokensAtom } from "~/state/server";

// export async function action({
//   request,
// }: ActionFunctionArgs) {
//   const body = await request.formData();

export const loader = async () => {
  const value = await store.get(tokensAtom);
  return json({ value });
};

export default function Configure() {
  const data = useLoaderData<typeof loader>();

  const [darkMode, setDarkMode] = useAtom(isDarkModeAtom);
  const [isPending, startTransition] = useTransition();
  return (
    <div>
      <h2>Configure</h2>
      <h3>Visual</h3>
      <p>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(e) => {
            startTransition(() => {
              setDarkMode(e.target.checked);
            });
          }}
          id="darkMode"
        />
        <label htmlFor="darkMode">Enable dark mode</label>
      </p>
      <h3>Inference</h3>
      <h4>Anthropic API token</h4>
      <p></p>
    </div>
  );
}
