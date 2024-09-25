import { atom, createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { entangleAtoms, getRealm, REALM, realmAtom } from "./entanglement";
import { atomEffect } from "jotai-effect";
import { makeRequestTool } from "./inference";

export const store = createStore();

type _Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "tool"; content: object | string };

export type Message = _Message & { fromServer?: boolean } & { template?: string };

export type Experiment = {
  [runId: string]: Message[];
};

export type Store = {
  isDarkMode?: boolean;
  experiments?: Record<string, Experiment>;
  templates?: Record<string, _Message>;
  tokens: {
    anthropic?: string;
  };
};

export const getInitialStore = () => ({ tokens: { anthropic: undefined }, experiments: {} });

export const voidAtom = atom<void>(void 0);

export const { bindToRealm, entangledAtoms, createMessageHandler } = entangleAtoms({
  [REALM]: realmAtom,
  storeAtom: atom<Store>(getInitialStore()),
  hasResolvedTokenAtom: atom(false),
});
const { storeAtom } = entangledAtoms;

export const experimentIdsAtom = atom((get) => {
  const store = get(storeAtom);
  const ids: Array<[id: string, subId: string]> = [];
  for (const id in store.experiments) {
    for (const runId in store.experiments[id]) {
      ids.push([id, runId]);
    }
  }
  return ids;
});

export const experimentsAtom = focusAtom(storeAtom, (o) => o.prop("experiments"));

export const deleteExperiment = atom(null, (get, set, id: string) => {
  set(experimentsAtom, (prev) => {
    const next = { ...prev };
    delete next[id];
    return next;
  });
});

export const getExperimentAtom = ({ id, runId }: ExperimentCursor) =>
  focusAtom(storeAtom, (o) => o.prop("experiments").optional().prop(id).optional().prop(runId));

export const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic"));

export const isDarkModeAtom = focusAtom(storeAtom, (o) => o.prop("isDarkMode"));

export type ExperimentCursor = { id: string; runId: string };

export const createExperiment = atom(
  null,
  (get, set, messages?: Message[], id?: string, runId?: string): ExperimentCursor => {
    const exp = get(experimentsAtom) ?? {};
    id ??= String(Object.keys(exp).length + 1);

    const thisExperiment = exp[id] ?? {};
    runId ??= String(Object.keys(thisExperiment).length + 1);

    set(experimentsAtom, (prev) => ({
      ...prev,
      [id]: { ...thisExperiment, [runId]: messages ?? [] },
    }));

    return { id, runId };
  },
);

export const appendToRun = atom(null, (get, set, cursor: ExperimentCursor, messages: Message[]) => {
  const { id, runId } = cursor || {};
  const focus = getExperimentAtom({ id, runId });
  const current = get(focus);
  set(focus, (prev = []) => [...prev, ...messages]);
  return current?.length ?? 0;
});

export const newChatAtom = atom<Message[]>([
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
  { role: "tool", content: makeRequestTool },
]);

export const templatesAtom = focusAtom(storeAtom, (o) => o.prop("templates"));