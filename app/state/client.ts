import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Chat } from "~/types";
import { createLens, createStorage, Storage } from "./common";
import { appStyle, darkMode } from "~/style";


export const importsRegistry = atom<Record<string, Chat[]>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);

const storage = atomWithStorage<Storage>("storage", createStorage());

export const isDarkModeAtom = createLens(storage, "isDarkMode");

export const stylesAtom = atom(async (get) => {
  const isDarkMode = await get(isDarkModeAtom);
  if (isDarkMode) return [appStyle, darkMode];
  return [appStyle];
});