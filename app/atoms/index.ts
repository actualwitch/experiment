import { atom } from "jotai";
import { Chat } from "~/types";


export const importsRegistry = atom<Record<string, Chat[]>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);
