import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, unwrap } from "jotai/utils";
import { Chat } from "~/types";
import { createStore, Store } from "./common";
import { appStyle, darkMode } from "~/style";
import { focusAtom } from "jotai-optics";

export const importsRegistry = atom<Record<string, Chat[]>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);

const store = atomWithStorage<Store>("store", createStore(), createJSONStorage(), { getOnInit: true });

export const isDarkModeAtom = focusAtom(store, (o) => o.prop("isDarkMode"));

export const stylesAtom = atom((get) => {
  const isDarkMode = get(isDarkModeAtom);
  if (isDarkMode) return [appStyle, darkMode];
  return [appStyle];
});
