import { json, MetaFunction, useLoaderData } from "@remix-run/react";
import { hasResolvedTokenAtom, store } from "~/state/server";

import { Paragraph } from "~/style";

const description = "Experiment is a simple tool to facilitate prompt engineering.";

export const meta: MetaFunction = () => {
  return [{ title: "Experiment" }, { name: "description", content: description }];
};

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
