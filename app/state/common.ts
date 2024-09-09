import { Atom, atom, createStore, Getter, Setter } from "jotai";
import { focusAtom } from "jotai-optics";
import { INTERNAL_PrdStore } from "jotai/vanilla/store";

export const store = createStore();

export type Message = {
  role: string;
  content?: string | object;
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

export type Realm = ReturnType<typeof getRealm>;

export const realmHierarchy: Realm[] = ["client", "worker", "server"];

export const REALM = Symbol.for("realm");

export const realmAtom = atom(() => getRealm());

export function entangleAtoms<T, EntangledAtomKey extends string>(
  config: { [REALM]: Atom<Realm> } & {
    [K in EntangledAtomKey]: Atom<T>;
  },
) {
  const realmAtom = config[REALM];
  const entangledAtoms: any = {};
  const overrides = atom<
    Partial<{
      [K in EntangledAtomKey]: T;
    }>
  >({});
  for (const key in config) {
    const defaultAtom = config[key as EntangledAtomKey];
    const writableAtom = atom(
      (get) => {
        const realm = get(realmAtom);
        const o: any = get(overrides);
        return get(o[key] ?? defaultAtom);
      },
      (get: Getter, set: Setter, props: any[]) => {
        const o: any = get(overrides);
        const thisAtom = o[key] ?? defaultAtom;
        set(thisAtom, props);
      },
    );
    entangledAtoms[key as EntangledAtomKey] = writableAtom;
  }

  function bindToRealm<T>(config: {
    [K in EntangledAtomKey]: Atom<T>;
  }) {
    store.set(overrides, (prev) => ({
      ...prev,
      ...config,
    }));

    return entangledAtoms;
  }
  const createMessageHandler = (store: INTERNAL_PrdStore) => {
    return (event: MessageEvent) => {
      console.log("Received message", event.data, "from", getRealm());
      Object.entries(event.data).forEach(async ([key, value]) => {
        if (Reflect.has(entangledAtoms, key)) {
          const atom = entangledAtoms[key as EntangledAtomKey];
          if (!atom) return;
          const thisValue = await store.get(atom);
          if (thisValue !== value) {
            globalThis.postMessage({ [key]: thisValue });
          }
        }
      });
    };
  };

  return {
    entangledAtoms,
    bindToRealm,
    createMessageHandler,
  };
}
export const getInitialStore = () => ({ tokens: { anthropic: undefined }, experiments: {} });
const foo = atom<Store>(getInitialStore());
export const { bindToRealm, entangledAtoms, createMessageHandler } = entangleAtoms({
  [REALM]: realmAtom,
  testAtom: atom(0),
  storeAtom: foo,
});

const storeAtom: typeof foo = entangledAtoms.storeAtom;

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

export const isDarkModeAtom = focusAtom(storeAtom, (o) => o.prop("isDarkMode"));

export const runExperiment = atom(null, (get, set, id: string | undefined, messages: Message[]) => {
  const exp = get(experimentsAtom) ?? {};
  const defId = id ?? Object.keys(exp).length + 1;
  const thisExperiment = exp[defId] ?? {};
  const runId = Object.keys(thisExperiment).length + 1;
  set(experimentsAtom, (prev) => ({
    ...prev,
    [defId]: { ...thisExperiment, [runId]: messages },
  }));
  return runId;
});

export const appendToRun = atom(null, (get, set, id: string, runId: string, messages: Message[]) => {
  const focus = focusAtom(storeAtom, (o) => o.prop("experiments").optional().prop(id).optional().prop(runId));
  set(focus, (prev) => [...prev, ...messages]);
});
