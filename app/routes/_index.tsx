import { json, useLoaderData } from "@remix-run/react";
import { description } from "~/meta";
import { hasResolvedTokenAtom, store } from "~/state/server";

import { Paragraph } from "~/style";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  const hasResolvedToken = await store.get(hasResolvedTokenAtom);
  return json({ hasResolvedToken });
};

export default function Index() {
  const { hasResolvedToken } = useLoaderData<typeof loader>();
  if (!hasResolvedToken) {
    return (
      <div>
        <h2>Begin</h2>
        <Paragraph>{description} Start by importing a CSV or adding API keys.</Paragraph>
      </div>
    );
  }
  return <div>some chat</div>;
}
