import { atom, createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage } from "jotai/utils";
import { INTERNAL_PrdStore } from "jotai/vanilla/store";
import { createJSONStorage } from "jotai/utils";
import { createFileStorage } from "~/utils";
import { type SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

export const store = createStore();

export type Message = {
  role: string;
  content?: string;
};

export type Experiment = {
  [runId: string]: Message[];
};

export type Store = {
  isDarkMode?: boolean;
  experiments?: Record<string, Experiment>;
  tokens: {
    anthropic?: string;
  };
};

const initialExperiments = {
  "1": [
    { role: "system", content: "You are a web server and you respond to incoming request with HTTP response" },
    { role: "user", content: "GET http://localhost:3000/" },
    {
      role: "assistant",
      content: `HTTP/1.1 200 OK Content-Type: text/html; charset=UTF-8 <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Welcome to My Local Server</title> </head> <body> <h1>Welcome to My Local Server</h1> <p>This is the default page served by your local server running on port 3000.</p> </body> </html>`,
    },
  ],
};

// export const initAtoms = (storage: SyncStorage<Store>, getOnInit = true) => {
//   const storeAtom = atomWithStorage<Store>(
//     "store",
//     { tokens: { anthropic: undefined }, experiments: { "1": initialExperiments } },
//     storage,
//     {
//       getOnInit,
//     },
//   );
//   return {
//     storeAtom,
//     isDarkModeAtom: focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
//     tokenAtom: focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic")),
//     experimentIdsAtom: atom((get) => {
//       const experiments = get(storeAtom).experiments;
//       return Object.keys(experiments ?? {});
//     }),
//     getExperimentAtom: (id: string) => focusAtom(storeAtom, (o) => o.path(`experiments.${id}`)),
//   };
// };

export const getRealm = () => {
  if (typeof window !== "undefined") {
    return "client";
  }
  if (typeof process === "object") {
    return "server";
  }
  // @ts-ignore
  if (typeof importScripts === "function") {
    return "worker";
  }
  throw new Error("Unknown realm");
};

export type Realm = "client" | "worker" | "server";

export const realmHierarchy: Array<ReturnType<typeof getRealm>> = ["client", "worker", "server"];

export const REALM = Symbol.for("realm");

export const realmAtom = atom(() => getRealm());

// export const storageAtom = atom<SyncStorage<Store> | undefined>((get) => {
//   const realm = get(realmAtom);
//   if (realm === "client") {
//     // const storage = createJSONStorage<Store>(() => (realm === "server" ? createFileStorage("store") : localStorage));
//     const storage = createJSONStorage<Store>(() => localStorage);
//     return storage;
//   }
//   return undefined;
// });

// export const storeAtomAtom = atom((get) => {
//   const storage = get(storageAtom);
//   const realm = get(realmAtom);
//   return atomWithStorage<Store>(
//     "store",
//     { tokens: { anthropic: undefined }, experiments: { "1": initialExperiments } },
//     storage,
//     {
//       getOnInit: realm === "server",
//     },
//   );
// });

export const storeAtom = atom<Store>({ tokens: { anthropic: undefined }, experiments: { "1": initialExperiments } });

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

export const getExperimentAtom = (id: string, runId: string) =>
  focusAtom(storeAtom, (o) => o.prop("experiments").optional().prop(id).optional().prop(runId));

export const getExperimentAsAnthropic = (id: string, runId: string) =>
  atom((get) => {
    const experiment = get(getExperimentAtom(id, runId));
    if (experiment) {
      let system = experiment
        .filter((msg) => msg.role === "system")
        .map((msg) => msg.content)
        .join("\n");
      const messages = experiment.filter((msg) => msg.role === "user");
      return { system, messages };
    }
    return null;
  });

export const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic"));
export const testAtom = atom(0);

export const isDarkModeAtom = focusAtom(storeAtom, (o) => o.prop("isDarkMode"));

export const entangledAtoms = {
  [REALM]: realmAtom,
  testAtom,
};

export type EntangledAtomKey = keyof Omit<typeof entangledAtoms, typeof REALM>;

export const createMessageHandler = (store: INTERNAL_PrdStore) => {
  return (event: MessageEvent) => {
    console.log("Received message", event.data, "from", getRealm());
    Object.entries(event.data).forEach(async ([key, value]) => {
      if (Reflect.has(entangledAtoms, key)) {
        const atom = entangledAtoms[key as EntangledAtomKey];
        const thisValue = await store.get(atom);
        if (thisValue !== value) {
          globalThis.postMessage({ [key]: thisValue });
        }
      }
    });
  };
};

export const runExperiment = atom(null, (get, set, id: string, messages: Message[]) => {
  const exp = get(experimentsAtom) ?? {};
  const thisExperiment = exp[id] ?? {};
  const runId = Object.keys(thisExperiment).length + 1;
  set(experimentsAtom, (prev) => ({
    ...prev,
    [id]: { ...thisExperiment, [runId]: messages },
  }));
  return runId;
});
