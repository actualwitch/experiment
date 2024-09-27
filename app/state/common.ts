import { atom, createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { entangleAtoms, getRealm, REALM, realmAtom } from "./entanglement";
import { atomEffect } from "jotai-effect";
import { makeRequestTool } from "./inference";

export const store = createStore();

type _Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: object | string }
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

export const newChatAtom = atom<Message[]>([{ role: "user", content: "" }]);

export const templatesAtom = focusAtom(storeAtom, (o) => o.prop("templates"));
