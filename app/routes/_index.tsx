import { json, NavLink, useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import { description } from "~/meta";

import { useEditor } from "./_editor";

import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";
import {} from "~/state/client";
import {
  entangledAtoms,
  experimentIdsAtom,
  Message,
  newChatAtom,
  store,
  templatesAtom,
  tokenAtom,
} from "~/state/common";
import { bs, Message as MessageComponent, Paragraph } from "~/style";
import { Atom, atom, useAtom, useAtomValue, useSetAtom, WritableAtom } from "jotai";
import { ReactNode, useRef, useState } from "react";
import { ColorPicker, View } from "~/dbg";
import styled from "@emotion/styled";
import { focusAtom } from "jotai-optics";
import { createAction } from "~/createLoader";
import { ActionFunctionArgs } from "@remix-run/node";

export { defaultMeta as meta } from "~/meta";

type Path = [number] | [number, string];
const selectionAtom = atom<Path | null>(null);

const lensAtom = atom(
  (get) => {
    const selection = get(selectionAtom);
    if (selection === null) {
      return get(newChatAtom);
    }
    // @ts-ignore
    const lens = focusAtom(newChatAtom, (o) => {
      let foo;
      for (const key of selection) {
        if (typeof key === "number") {
          foo = o.nth(key);
        }
        if (typeof key === "string") {
          // @ts-ignore
          foo = o.prop(key);
        }
      }
      if (foo) {
        return foo;
      }
      throw new Error("foo is undefined");
    });
    return get(lens);
  },
  (get, set, update: unknown) => {
    const selection = get(selectionAtom);
    if (selection === null) {
      set(newChatAtom, update as Message[]);
      return;
    }
    const lens = focusAtom(newChatAtom, (o) => {
      let foo: any = o;
      for (const key of selection) {
        if (typeof key === "number") {
          foo = foo.nth(key);
        }
        if (typeof key === "string") {
          foo = foo.prop(key);
        }
      }
      if (foo) {
        return foo;
      }
      throw new Error("foo is undefined");
    });
    set(lens, update);
  },
);

const baseHeight = bs(6);

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

function comparePaths(a: Path, b: Path) {
  if (!b || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function MessageView({
  message: _message,
  selector,
  ...rest
}: { message: Message; selector: Path } & React.HTMLAttributes<HTMLDivElement>) {
  const [selection, setSelection] = useAtom(selectionAtom);
  const Editor = useEditor();
  const setter = useSetAtom(lensAtom);
  const [index] = selector;
  const templates = useAtomValue(templatesAtom);

  const message = { ..._message };
  for (const [name, template] of Object.entries(templates ?? {})) {
    if (message.content === template.content && message.role === template.role) {
      message.content = name;
      message.template = true;
    }
  }

  const ref = useRef<null | HTMLElement>(null);

  let innerContent: ReactNode;

  let contentType: string | undefined;

  if (selection && comparePaths(selector, selection) && Editor) {
    const [{ height }] = ref.current?.getClientRects() ?? [{ height: baseHeight }];
    innerContent ??= (
      <Editor
        minHeight={height}
        setValue={(value) => {
          setter(value);
          setSelection(null);
        }}>
        {message.content}
      </Editor>
    );
  }
  if (["string", "object"].includes(typeof message.content)) {
    contentType = message.template ? "template" : typeof message.content;
    innerContent ??= (
      <View
        style={{
          float: message.fromServer ? "right" : "left",
        }}>
        {message.content}
      </View>
    );
  }
  innerContent ??= (<code>{"<Empty>"}</code>);

  return (
    <MessageComponent
      ref={ref}
      role={message.role}
      contentType={contentType}
      isSelected={index === selection?.[0]}
      onClick={() => {
        if (selection?.length === 2) return;
        setSelection([selector[0]]);
      }}
      onDoubleClick={() => setSelection(selector)}
      {...rest}>
      {innerContent}
    </MessageComponent>
  );
}

const ChatContainer = styled.div`
  & > * {
    min-height: ${baseHeight}}
  }
`;

function ChatPreview() {
  const [chat, setChat] = useAtom(newChatAtom);

  return (
    <ChatContainer>
      {chat?.map?.((message, index) => {
        return <MessageView key={index} message={message} selector={[index, "content"]} />;
      })}
    </ChatContainer>
  );
}

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
  const sidebar = useSidebar();
  const submit = useSubmit();
  const [chat, setChat] = useAtom(newChatAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [fooAtom] = useAtom(fooAtomAtom);
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
      <ChatPreview />
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
      {sidebar &&
        createPortal(
          <>
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
          </>,
          sidebar,
        )}
    </>
  );
}
