import { json, NavLink, useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import { description } from "~/meta";

import { useEditor } from "./_editor";

import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";
import {} from "~/state/client";
import { experimentIdsAtom, Message, store } from "~/state/common";
import { hasResolvedTokenAtom } from "~/state/server";
import { bs, Message as MessageComponent, Paragraph } from "~/style";
import { atom, useAtom, useSetAtom } from "jotai";
import { ReactNode } from "react";
import { Debugger } from "~/dbg";
import styled from "@emotion/styled";
import { focusAtom } from "jotai-optics";

export { defaultMeta as meta } from "~/meta";

const newChatAtom = atom<Message[]>([
  { role: "system", content: "You are a web server and you respond to incoming request with HTTP response" },
  { role: "user", content: "GET /index.html" },
]);

type Path = Array<string | number>;
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
  const hasResolvedToken = await store.get(hasResolvedTokenAtom);
  const experimentIds = await store.get(experimentIdsAtom);
  return json({ hasResolvedToken, experimentIds });
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
  message,
  selector,
  ...rest
}: { message: Message; selector: Path } & React.HTMLAttributes<HTMLDivElement>) {
  const [selection, setSelection] = useAtom(selectionAtom);
  const Editor = useEditor();
  const setter = useSetAtom(lensAtom);

  let innerContent: ReactNode;

  if (selection && comparePaths(selector, selection) && Editor) {
    innerContent ??= (
      <Editor
        minHeight={baseHeight}
        setValue={(value) => {
          setter(value);
          setSelection(null);
        }}>
        {message.content}
      </Editor>
    );
  }
  if (typeof message.content === "string" && message.content) {
    innerContent ??= message.content;
  }
  if (typeof message.content === "object") {
    innerContent ??= <Debugger>{message.content}</Debugger>;
  }
  innerContent ??= <span>{"<Empty>"}</span>;

  return (
    <MessageComponent role={message.role} onClick={() => setSelection(selector)} {...rest}>
      <code>{innerContent}</code>
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

export default function Index() {
  const { hasResolvedToken, experimentIds } = useLoaderData<typeof loader>();
  const sidebar = useSidebar();
  const submit = useSubmit();
  const [chat, setChat] = useAtom(newChatAtom);
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
      <aside>
        <h3>Actions</h3>
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
