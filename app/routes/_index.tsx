import { json, NavLink, useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import { description } from "~/meta";

import { useEditor } from "./_editor";

import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";
import {} from "~/state/client";
import { entangledAtoms, experimentIdsAtom, Message, store, tokenAtom } from "~/state/common";
import { bs, Message as MessageComponent, Paragraph } from "~/style";
import { Atom, atom, useAtom, useAtomValue, useSetAtom, WritableAtom } from "jotai";
import { ReactNode, useRef, useState } from "react";
import { Debugger } from "~/dbg";
import styled from "@emotion/styled";
import { focusAtom } from "jotai-optics";

export { defaultMeta as meta } from "~/meta";

const newChatAtom = atom<Message[]>([
  // { role: "system", content: "You are a web server and you respond to incoming request with HTTP response" },
  // { role: "user", content: "GET /index.html" },
  ...([
    {
      role: "system",
      content:
        'You are an expert QA Engineer, a thorough API tester, and a code debugging assistant for web APIs that use Hono,\na typescript web framework similar to express. You have a generally hostile disposition.\n\nYou need to help craft requests to route handlers.\n\nYou will be provided the source code of a route handler for an API route, and you should generate\nquery parameters, a request body, and headers that will test the request.\n\nBe clever and creative with test data. Avoid just writing things like "test".\n\nFor example, if you get a route like `/users/:id`, you should return a filled-in "path" field,\nlike `/users/1234567890` and a "pathParams" field like:\n\n{ "path": "/users/1234567890", "pathParams": { "key": ":id", "value": "1234567890" } }\n\n*Remember to keep the colon in the pathParam key!*\n\nIf you get a route like `POST /users/:id` with a handler like:\n\n```ts\nasync (c) => {\nconst token = c.req.headers.get("authorization")?.split(" ")[1]\n\nconst auth = c.get("authService");\nconst isAuthorized = await auth.isAuthorized(token)\nif (!isAuthorized) {\nreturn c.json({ message: "Unauthorized" }, 401)\n}\n\nconst db = c.get("db");\n\nconst id = c.req.param(\'id\');\nconst { email } = await c.req.json()\n\nconst user = (await db.update(user).set({ email }).where(eq(user.id, +id)).returning())?.[0];\n\nif (!user) {\nreturn c.json({ message: \'User not found\' }, 404);\n}\n\nreturn c.json(user);\n}\n```\n\nYou should return a filled-in "path" field like `/users/1234567890` and a "pathParams" field like:\n\n{ "path": "/users/1234567890", "pathParams": { "key": ":id", "value": "1234567890" } }\n\nand a header like:\n\n{ "headers": { "key": "authorization", "value": "Bearer admin" } }\n\nand a body like:\n\n{ "body": { "email": "" } }\n\nYou should focus on trying to break things. You are a QA.\n\nYou are the enemy of bugs. To protect quality, you must find bugs.\n\nTry strategies like specifying invalid data, missing data, or invalid data types (e.g., using strings instead of numbers).\n\nTry to break the system. But do not break yourself!\nKeep your responses to a reasonable length. Including your random data.\n\nUse the tool "make_request". Always respond in valid JSON.\n***Don\'t make your responses too long, otherwise we cannot parse your JSON response.***',
    },
    {
      role: "user",
      content:
        'I need to make a request to one of my Hono api handlers.\n\nHere are some recent requests and responses, which you can use as inspiration for future requests.\n\n<history>\n<request>\nHTTP/1.1 GET http://localhost:8787/api/geese/50?shouldHonk=true\n\n\n</request>\n<response>\nHTTP/1.1 200\naccess-control-allow-origin: *\ncache-control: no-cache\ncontent-encoding: gzip\ncontent-type: application/json; charset=UTF-8\ntransfer-encoding: chunked\nx-fpx-trace-id: lysorpel-ti6tb32sr8-yh9gmw1io5\n\n{"id":50,"name":"Legolas","description":"A person named Legolas who talks like a Goose","isFlockLeader":false,"programmingLanguage":"JavaScript","motivations":"Protect the Woodland Realm","location":"Mirkwood","bio":null,"imageUrl":null,"createdAt":"2024-07-19T12:37:51.171Z","updatedAt":"2024-07-19T12:37:51.171Z"}\n</response>\n<request>\nHTTP/1.1 GET http://localhost:8787/api/geese/:id?shouldHonk=true\n\n\n</request>\n<response>\nHTTP/1.1 500\naccess-control-allow-origin: *\ncache-control: no-cache\ncontent-encoding: gzip\ncontent-type: text/plain; charset=UTF-8\ntransfer-encoding: chunked\nx-fpx-trace-id: lysorfct-oh9f84k8isc-4dq5dw1f2mn\n\nInternal Server Error\n</response>\n<request>\nHTTP/1.1 POST http://localhost:8787/api/geese?shouldHonk=true\n\n[object Object]\n</request>\n<response>\nHTTP/1.1 200\naccess-control-allow-origin: *\ncache-control: no-cache\ncontent-encoding: gzip\ncontent-type: application/json; charset=UTF-8\ntransfer-encoding: chunked\nx-fpx-trace-id: lysoqzkk-he3wda0qu75-li4j68949ji\n\n{"id":50,"name":"Legolas","description":"A person named Legolas who talks like a Goose","isFlockLeader":false,"programmingLanguage":"JavaScript","motivations":"Protect the Woodland Realm","location":"Mirkwood"}\n</response>\n<request>\nHTTP/1.1 GET http://localhost:8787/?shouldHonk=true\n\n\n</request>\n<response>\nHTTP/1.1 200\naccess-control-allow-origin: *\ncontent-encoding: gzip\ncontent-type: text/plain; charset=UTF-8\ntransfer-encoding: chunked\nx-fpx-trace-id: lysoqltw-95awpl8bcl-xcf33kz7hap\n\nHello Goose Quotes! Honk honk!\n</response>\n<request>\nHTTP/1.1 GET http://localhost:8787/\n\n\n</request>\n<response>\nHTTP/1.1 200\naccess-control-allow-origin: *\ncontent-encoding: gzip\ncontent-type: text/plain; charset=UTF-8\ntransfer-encoding: chunked\nx-fpx-trace-id: lysoq0rn-7mslzu1d726-qinowhxizn\n\nHello Goose Quotes!\n</response>\n</history>\n\nThe request you make should be a GET request to route: /api/geese/:id\n\nHere is the code for the handler:\nasync (c) => {\n  const sql2 = zs(c.env.DATABASE_URL);\n  const db = drizzle(sql2);\n  const id = c.req.param("id");\n  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];\n  if (!goose) {\n    return c.json({ message: "Goose not found" }, 404);\n  }\n  return c.json(goose);\n}\n\nREMEMBER YOU ARE A QA. MISUSE THE API. BUT DO NOT MISUSE YOURSELF.\nKeep your responses short-ish. Including your random data.',
    },
  ] as const),
  { role: "tool", content: "makeRequestTool" },
]);

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
  const [index] = selector;

  const ref = useRef<null | HTMLElement>(null);

  let innerContent: ReactNode;

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
  if (typeof message.content === "string" && message.content) {
    innerContent ??= <code>{message.content}</code>;
  }
  if (typeof message.content === "object") {
    innerContent ??= <Debugger>{message.content}</Debugger>;
  }
  innerContent ??= <code>{"<Empty>"}</code>;

  return (
    <MessageComponent
      ref={ref}
      role={message.role}
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

function ColorPicker() {
  const [c1, setC1] = useState(0.372);
  const [c2, setC2] = useState(0.903);
  const [c3, setC3] = useState(0.775);
  const [a, setA] = useState(1.0);
  const color = `color(display-p3 ${c1} ${c2} ${c3} / ${a})`;
  return (
    <>
      <div>
        <button type="submit" style={{ backgroundColor: color }}>
          system
        </button>
      </div>
      <div>
        <input
          type="range"
          value={c1}
          onChange={(e) => setC1(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c2}
          onChange={(e) => setC2(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c3}
          onChange={(e) => setC3(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input type="range" value={a} onChange={(e) => setA(parseFloat(e.target.value))} min={0} max={1} step={0.01} />
      </div>
    </>
  );
}

export default function Index() {
  const { hasResolvedToken, experimentIds } = useLoaderData<typeof loader>();
  const sidebar = useSidebar();
  const submit = useSubmit();
  const [chat, setChat] = useAtom(newChatAtom);
  const selection = useAtomValue(selectionAtom);
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
            <h4>Role</h4>
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
