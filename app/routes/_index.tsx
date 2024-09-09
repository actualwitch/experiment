import { json, NavLink, useFetcher, useLoaderData } from "@remix-run/react";
import { description } from "~/meta";

import { useEditor } from "./_editor";

import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";
import {} from "~/state/client";
import { experimentIdsAtom, store } from "~/state/common";
import { hasResolvedTokenAtom } from "~/state/server";
import { Paragraph } from "~/style";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  const hasResolvedToken = await store.get(hasResolvedTokenAtom);
  const experimentIds = await store.get(experimentIdsAtom);
  return json({ hasResolvedToken, experimentIds });
};

export default function Index() {
  const { hasResolvedToken, experimentIds } = useLoaderData<typeof loader>();
  const Editor = useEditor();
  const sidebar = useSidebar();
  const { Form, data } = useFetcher();
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
      </aside>
      {sidebar &&
        createPortal(
          <>
            <h3>Experiments</h3>
            <ul>
              {experimentIds.map(([id, subId]) => (
                <li key={id}>
                  <NavLink to={`/experiment/${id}/${subId}`}>
                    Experiment #{id}/{subId}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>,
          sidebar,
        )}
    </>
  );
}
