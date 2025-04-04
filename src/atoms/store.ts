import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import type { ProviderType } from "../feature/inference/types";
import type { FONT_STACKS } from "../style";
import type { ExperimentWithMeta, Persona, SerialExperiment, _Message } from "../types";
import { createFileStorage } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { getRealm } from "../utils/realm";
import type { ExperimentCursor } from "./experiment";

export type Store = {
  isDarkMode?: boolean;
  isBoldText?: boolean;
  fontStack?: keyof typeof FONT_STACKS;
  experimentLayout?: "left" | "chat" | "chat-reverse";
  isMetaExperiment?: boolean;
  isTransRights?: boolean;
  selectedProvider?: ProviderType;
  selectedModel?: string;
  experiments?: Record<string, SerialExperiment>;
  personas?: Record<string, Persona>;
  templates?: Record<string, _Message | ExperimentWithMeta>;
  tokens: {
    anthropic?: string;
    mistral?: string;
    openai?: string;
  };
};

export const getInitialStore = (): Store => ({
  tokens: {},
  experiments: {},
});
export const storeAtom = divergentAtom(
  () => {
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
  },
  () => {
    if (getRealm() === "client") {
      return atom<Store>(getInitialStore());
    }
  },
  () => {
    try {
      return atomWithStorage<Store>(
        "store",
        getInitialStore(),
        createJSONStorage(() => localStorage),
        {
          getOnInit: true,
        },
      );
    } catch (e) {
      console.error(e);
      return atom<Store>(getInitialStore());
    }
  },
);

export const selectedProviderAtom = entangledAtom(
  "selected-provider",
  focusAtom(storeAtom, (o) => o.prop("selectedProvider")),
);
export const modelAtom = entangledAtom(
  "model",
  focusAtom(storeAtom, (o) => o.prop("selectedModel")),
);

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

export const isBoldTextAtom = entangledAtom(
  "isBoldText",
  focusAtom(storeAtom, (o) => o.prop("isBoldText")),
);

export const fontStackAtom = entangledAtom(
  "fontStack",
  focusAtom(storeAtom, (o) => o.prop("fontStack")),
);

export const isDarkModeAtom = entangledAtom(
  "isDarkMode",
  focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
);

export const isTransRightsAtom = entangledAtom(
  "isTransRights",
  focusAtom(storeAtom, (o) => o.prop("isTransRights")),
);

export const isMetaExperimentAtom = entangledAtom(
  "isMetaExperiment",
  focusAtom(storeAtom, (o) => o.prop("isMetaExperiment")),
);

export const templatesAtom = entangledAtom(
  "templates",
  focusAtom(storeAtom, (o) => o.prop("templates")),
);

export const experimentLayoutAtom = entangledAtom(
  "experimentLayout",
  focusAtom(storeAtom, (o) => o.prop("experimentLayout")),
);

export const parentAtom = entangledAtom("parent", atom<string | undefined>(undefined));

export const debugAtom = entangledAtom(
  "debug",
  atom(() => {
    if (getRealm() !== "server") return false;
    return process.env.DEBUG === "true";
  }),
);

export const nopeAtom = atom((get) => null);
