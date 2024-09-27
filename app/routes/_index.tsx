import { json, NavLink, useLoaderData, useSubmit } from "@remix-run/react";
import { description } from "~/meta";

import styled from "@emotion/styled";
import { ActionFunctionArgs } from "@remix-run/node";
import { atom, useAtom, useAtomValue } from "jotai";
import { focusAtom } from "jotai-optics";
import { ChatPreview, selectionAtom } from "~/chat";
import { SidebarInput } from "~/navigation";
import { experimentIdsAtom, newChatAtom, store, templatesAtom, tokenAtom } from "~/state/common";
import { bs, Paragraph } from "~/style";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  const token = await store.get(tokenAtom);
  const experimentIds = await store.get(experimentIdsAtom);
  return json({ hasResolvedToken: Boolean(token), experimentIds });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    if (value) {
      store.set(templatesAtom, (prev) => ({ ...prev, [key]: value }));
    }
  }
  return json({ result: "ok" });
};

const fooAtomAtom = atom((get) => {
  const selection = get(selectionAtom);
  if (selection === null) {
    return atom<string | null>(null);
  }
  const roleLens = focusAtom(newChatAtom, (o) => {
    const [index] = selection;
    return o.nth(index).prop("role");
  });
  return roleLens;
});

const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  padding-left: ${bs()};
  & > div {
    margin-bottom: ${bs(1 / 5)};
  }
`;

export default function Index() {
  const { hasResolvedToken, experimentIds } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [chat, setChat] = useAtom(newChatAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const fooAtom = useAtomValue(fooAtomAtom);
  const [role, setRole] = useAtom(fooAtom);
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
      <ChatPreview chatAtom={newChatAtom} />
      <Aside>
        <h3>Actions</h3>
        <div>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              setChat([...chat, { role: "user", content: "" }]);
            }}>
            Add message
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              submit(chat as any, {
                method: "post",
                action: "/inference",
                encType: "application/json",
              });
            }}>
            Send it
          </button>
        </div>
        {selection !== null && (
          <>
            <h4>This message</h4>
            <div>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const newExperiment = chat.filter((_, idx) => idx !== selection[0]);
                  setChat(newExperiment);
                  setSelection(null);
                }}>
                delete
              </button>
              <button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  const text = await navigator.clipboard.readText();
                  let value: string | object = text;
                  try {
                    if (role === "tool") {
                      value = JSON.parse(text);
                    }
                  } catch {}
                  setChat((chat) => chat.map((msg, idx) => (idx === selection[0] ? { ...msg, content: value } : msg)));
                }}>
                paste
              </button>
              <button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  const name = prompt("Name of the template");
                  if (!name) return;
                  submit({ [name]: chat[selection[0]] } as any, {
                    method: "post",
                    encType: "application/json",
                  });
                }}>
                template
              </button>
            </div>
            <h5>Role</h5>
            <div>
              <button
                type="submit"
                disabled={role === "system"}
                onClick={(e) => {
                  e.preventDefault();
                  setRole("system");
                }}>
                system
              </button>
              <button
                type="submit"
                disabled={role === "user"}
                onClick={(e) => {
                  e.preventDefault();
                  setRole("user");
                }}>
                user
              </button>
              <button
                type="submit"
                disabled={role === "tool"}
                onClick={(e) => {
                  e.preventDefault();
                  setRole("tool");
                }}>
                tool
              </button>
            </div>
          </>
        )}
      </Aside>
      <SidebarInput>
        <h3>Experiments</h3>
        <ul>
          {experimentIds.map(([id, subId]) => (
            <li key={id + subId}>
              <NavLink to={`/experiment/${id}/${subId}`}>
                Experiment #{id}/{subId}
              </NavLink>
            </li>
          ))}
        </ul>
      </SidebarInput>
    </>
  );
}
