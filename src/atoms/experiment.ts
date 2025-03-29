import { atom } from "jotai";

import { modelLabels } from "../feature/inference/types";
import type { Message } from "../types";
import { entangledAtom } from "../utils/entanglement";
import { experimentsAtom, modelAtom, parentAtom, selectedProviderAtom } from "./store";

export const experimentAtom = entangledAtom("experiment", atom<Message[]>([]));

export type ExperimentCursor = { id: string; runId: string };

export const createExperiment = atom(
  null,
  (get, set, messages?: Message[], id?: string, runId?: string): ExperimentCursor => {
    const exp = get(experimentsAtom) ?? {};

    const parent = get(parentAtom);
    id ??= parent;

    id ??= String(Object.keys(exp).length + 1);

    const thisExperiment = exp[id] ?? {};
    runId ??= String(Object.keys(thisExperiment).length + 1);

    const provider = get(selectedProviderAtom);
    const model = get(modelAtom);
    const modelName = provider && model && modelLabels[provider][model];

    set(experimentsAtom, (prev) => ({
      ...prev,
      [id]: {
        ...thisExperiment,
        [runId]: {
          messages: messages ?? [],
          timestamp: new Date().toISOString(),
          model: modelName,
        },
      },
    }));

    return { id, runId };
  },
);
