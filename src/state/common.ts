import Anthropic from "@anthropic-ai/sdk";
import { atom, createStore, type WritableAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import type { Atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { entangledAtom } from "./entanglement";
import { createFileStorage, getRealm } from "../utils";
import { experimentToAnthropic } from "../adapters/anthropic";

export const store = createStore();

type _Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: object | string }
  | { role: "tool"; content: object | string };

export type Message = _Message & { fromServer?: boolean } & {
  template?: string;
};

export type Role = "system" | "user" | "assistant" | "tool";

export type Experiment = {
  [runId: string]: Message[];
};

export type Store = {
  isDarkMode?: boolean;
  experiments?: Record<string, Experiment>;
  templates?: Record<string, _Message>;
  tokens: {
    anthropic?: string;
    openai?: string;
  };
};

function divergentAtom<T extends Atom<unknown> | WritableAtom<unknown, unknown[], unknown>>(
  ...cases: Array<() => T | undefined>
) {
  let result: T | undefined;
  for (const c of cases) {
    result = c();
    if (result) break;
  }
  if (!result) throw new Error("No atom was created");
  return result;
}

export const getInitialStore = (): Store => ({
  tokens: { anthropic: undefined },
  experiments: {},
});
export const storeAtom = divergentAtom(() => {
  if (getRealm() === "server") {
    return atomWithStorage<Store>(
      "store",
      getInitialStore(),
      createJSONStorage(() => createFileStorage("store")),
      {
        getOnInit: true,
      },
    );
  }

  return atom<Store>(getInitialStore());
});

export const voidAtom = atom<void>(void 0);

export const experimentAtom = entangledAtom("experiment", atom<Message[]>([]));

export const experimentIdsAtom = entangledAtom(
  "experimentIds",
  atom((get) => {
    const store = get(storeAtom);
    const ids: Array<[id: string, subId: string]> = [];
    for (const id in store.experiments) {
      for (const runId in store.experiments[id]) {
        ids.push([id, runId]);
      }
    }
    return ids;
  }),
);

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

export const tokensAtom = entangledAtom(
  "tokens",
  focusAtom(storeAtom, (o) => o.prop("tokens")),
);

export const isDarkModeAtom = entangledAtom(
  "isDarkMode",
  focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
);

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

export const templatesAtom = focusAtom(storeAtom, (o) => o.prop("templates"));