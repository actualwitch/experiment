import { atom, createStore, WritableAtom } from "jotai";
import { readFile, writeFile } from "node:fs/promises";
import { createLens, Storage, StorageAtom } from "./common";
export const store = createStore();
export const storageAtom: StorageAtom = atom(
  async () => {
    try {
      const contents = await readFile("./store.json", "utf-8");
      return JSON.parse(contents) || createStore();
    } catch (e) {
      return createStore();
    }
  },
  (get, set, newValue: Storage) => {
    writeFile("./store.json", JSON.stringify(newValue, null, 2), "utf-8");
  },
);

export const isDarkModeAtom = createLens(storageAtom, "isDarkMode");

export const tokensAtom = createLens(storageAtom, "tokens");
