import { atom, createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { entangleAtoms, REALM, realmAtom } from "./entanglement";

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


const timeAtom = atom<string | null>(null);

export const { bindToRealm, entangledAtoms, createMessageHandler } = entangleAtoms({
  [REALM]: realmAtom,
  storeAtom: atom<Store>(getInitialStore()),
  timeAtom,
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

export const createExperiment = atom(null, (get, set, messages: Message[], id?: string, runId?: string): ExperimentCursor => {
  const exp = get(experimentsAtom) ?? {};
  id ??= String(Object.keys(exp).length + 1);

  const thisExperiment = exp[id] ?? {};
  runId ??= String(Object.keys(thisExperiment).length + 1);

  set(experimentsAtom, (prev) => ({
    ...prev,
    [id]: { ...thisExperiment, [runId]: messages },
  }));

  return {id, runId};
});

export const appendToRun = atom(null, (get, set, {id, runId}: ExperimentCursor, messages: Message[]) => {
  const focus = getExperimentAtom({id, runId});
  set(focus, (prev) => [...prev, ...messages]);
});
