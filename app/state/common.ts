import { atom, createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { entangleAtoms, getRealm, REALM, realmAtom } from "./entanglement";
import { atomEffect } from "jotai-effect";

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

export const getInitialStore = () => ({ tokens: { anthropic: undefined }, experiments: {} });



export const voidAtom = atom<void>(void 0);

export const { bindToRealm, entangledAtoms, createMessageHandler, sseSubscriptionEffect } = entangleAtoms({
  [REALM]: realmAtom,
  storeAtom: atom<Store>(getInitialStore()),
  testAtom: atom("test"),
  hasResolvedTokenAtom: atom(false),
  laughingAtom: atom(null, (get, set, cursor: ExperimentCursor) => {
    const idx = set(appendToRun, cursor, [{role: "assistant", content: ""}]);
    set(intervalAppend, cursor, idx);
  }),
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

export const getExperimentAtom = ({id, runId}: ExperimentCursor) =>
  focusAtom(storeAtom, (o) => o.prop("experiments").optional().prop(id).optional().prop(runId));

export const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic"));

export const isDarkModeAtom = focusAtom(storeAtom, (o) => o.prop("isDarkMode"));

export type ExperimentCursor = { id: string; runId: string };

export const createExperiment = atom(null, (get, set, messages?: Message[], id?: string, runId?: string): ExperimentCursor => {
  const exp = get(experimentsAtom) ?? {};
  id ??= String(Object.keys(exp).length + 1);

  const thisExperiment = exp[id] ?? {};
  runId ??= String(Object.keys(thisExperiment).length + 1);

  set(experimentsAtom, (prev) => ({
    ...prev,
    [id]: { ...thisExperiment, [runId]: messages ?? [] },
  }));

  return {id, runId};
});

export const appendToRun = atom(null, (get, set, cursor: ExperimentCursor, messages: Message[]) => {
  const {id, runId} = cursor || {};
  const focus = getExperimentAtom({id, runId});
  const current = get(focus);
  set(focus, (prev = []) => [...prev, ...messages]);
  return current?.length ?? 0;
});

export const intervalAppend = atom(null, (get, set, _cursor: ExperimentCursor, messageIdx: number) => {
  const {id, runId} = _cursor || {};
  const text = `I thought what I'd do was, I'd pretend I was one of those deaf-mutes.  `;
  let cursor = 0;
  const focus = getExperimentAtom({id, runId});
  const interval = setInterval(() => {
    set(focus, (prev) => {
      const next = [...prev];
      next[messageIdx] = { role: "assistant", content: text.slice(0, cursor) };
      cursor += 1;
      if (cursor > text.length) {
        cursor = 0;
      }
      return next;
    });
  }, 100);
  return () => clearInterval(interval);
});

