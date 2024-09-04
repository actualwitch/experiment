import { atom } from "jotai";
import { createJSONStorage } from "jotai/utils";
import { appStyle, darkMode } from "~/style";
import { Chat } from "~/types";
import { initAtoms } from "./common";

export const importsRegistry = atom<Record<string, Chat[]>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);

export const { storeAtom, isDarkModeAtom, tokenAtom } = initAtoms(createJSONStorage(), false);

export const stylesAtom = atom((get) => {
  const isDarkMode = get(isDarkModeAtom);
  if (isDarkMode) return [...appStyle, darkMode];
  return appStyle;
});

// function Bob<State>(state = {} as State) {
//   return {
//     with<Key extends string, Value extends unknown>(key: Key, value: Value) {
//       const newState = { ...state, [key]: value } as State & {
//         [k in Key]: Value;
//       };
//       return Bob(newState);
//     },
//     build() {
//       return state;
//     },
//   };
// }
