import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { P, match } from "ts-pattern";
import type { ProviderType } from "../feature/inference/types";
import type { FONT_STACKS } from "../style";
import type { ExperimentWithMeta, Persona, SerialExperiment, _Message } from "../types";
import { createFileStorage } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { getRealm, hasBackend } from "../utils/realm";

export type Store = {
  name?: string;
  pronouns?: string;
  isOnboarded?: boolean;
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
    local?: "";
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
    if (hasBackend()) {
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

export const nameAtom = entangledAtom(
  "name",
  focusAtom(storeAtom, (o) => o.prop("name")),
);

export const pronounsAtom = entangledAtom(
  "pronouns",
  focusAtom(storeAtom, (o) => o.prop("pronouns")),
);

export const identityAtom = atom((get) => {
  const name = get(nameAtom);
  const pronouns = get(pronounsAtom);
  return match([name, pronouns])
    .with([P.string, P.string], ([name, pronouns]) => `${name} (${pronouns})`)
    .with([P.string, P.nullish], ([name]) => name)
    .otherwise(() => undefined);
});

export const selectedProviderAtom = entangledAtom(
  "selected-provider",
  focusAtom(storeAtom, (o) => o.prop("selectedProvider")),
);
export const modelAtom = entangledAtom(
  "model",
  focusAtom(storeAtom, (o) => o.prop("selectedModel")),
);

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

export const isOnboardedAtom = entangledAtom(
  "isOnboarded",
  focusAtom(storeAtom, (o) => o.prop("isOnboarded")),
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

export const setTokenAtom = atom(null, (get, set, provider: string, token: string) => {
  let value = token;

  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  set(tokensAtom, { ...get(tokensAtom), [provider]: value });
});
