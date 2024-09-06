import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage } from "jotai/utils";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

type Message = {
  role: string;
  content?: string;
};

type Experiment = {
  [runId: string]: {
    messages: Message[];
    response: Message;
  };
};

export type Store = {
  isDarkMode?: boolean;
  experiments?: Record<string, Experiment>;
  tokens: {
    anthropic?: string;
  };
};

export const initAtoms = (storage: SyncStorage<Store>, getOnInit = true) => {
  const storeAtom = atomWithStorage<Store>("store", { tokens: { anthropic: undefined }, experiments: {} }, storage, {
    getOnInit,
  });
  return {
    storeAtom,
    isDarkModeAtom: focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
    tokenAtom: focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic")),
    experimentIdsAtom: atom((get) => {
      const experiments = get(storeAtom).experiments;
      return Object.keys(experiments ?? {});
    }),
  };
};
