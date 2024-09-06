import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { description } from "~/meta";
import { hasResolvedTokenAtom, store } from "~/state/server";

import { useEditor } from "./_editor";

import { Paragraph } from "~/style";
import { Debugger } from "~/dbg";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  const hasResolvedToken = await store.get(hasResolvedTokenAtom);
  return json({ hasResolvedToken });
};

export default function Index() {
  const { hasResolvedToken } = useLoaderData<typeof loader>();
  const Editor = useEditor();
  const {Form, data} = useFetcher();
  if (!hasResolvedToken) {
    return (
      <div>
        <h2>Begin</h2>
        <Paragraph>{description} Start by importing a CSV or adding API keys.</Paragraph>
      </div>
    );
  }
  return (
    <>
      <div>{Editor && <Editor />}</div>
      <aside>
        <h3>Actions</h3>
        <Form method="post" action="/inference">
          <button type="submit">Send it</button>
        </Form>
        <Debugger>
          {data}
        </Debugger>
      </aside>
    </>
  );
}
