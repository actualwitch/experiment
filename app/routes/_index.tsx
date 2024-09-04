import { LoaderFunction } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";
import { spawn } from "child_process";
import { Debugger } from "~/dbg";
import { store, tokenAtom } from "~/state/server";

import { Paragraph } from "~/style";

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export const loader: LoaderFunction = async () => {
  const reference = store.get(tokenAtom);
  if (!reference) return json({ error: "No token reference found", result: "error" });
  const handle = spawn("op", ["read", reference]);
  return new Promise((ok, ko) => {
    handle.stdout.on("data", (data) => {
      ok(json({ token: data.toString(), result: "success" }));
    });

    handle.on("close", (code) => {
      ok(json({ error: "Could not read token", code, result: "error" }));
    });
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h2>Welcome</h2>
      <Paragraph>
        Experiment is a simple tool to facilitate prompt engineering. Start by importing a CSV or adding API keys.
      </Paragraph>
      <Debugger>{data}</Debugger>
    </div>
  );
}
