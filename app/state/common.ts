import { focusAtom } from "jotai-optics";
import { atomWithStorage } from "jotai/utils";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

export type Store = {
  isDarkMode?: boolean;
  tokens: {
    anthropic?: string;
  };
};

export const initAtoms = (storage: SyncStorage<Store>, getOnInit = true) => {
  const storeAtom = atomWithStorage<Store>("store", { tokens: { anthropic: undefined } }, storage, { getOnInit });
  return {
    storeAtom,
    isDarkModeAtom: focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
    tokenAtom: focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic")),
  };
};
