import { createStore } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { readFileSync, writeFileSync } from "node:fs";
import { Store, createStore as createSyncedStore } from "./common";

export const store = createStore();

const readFile = (fileName: string) => {
  try {
    return readFileSync(fileName, {
      encoding: "utf-8",
      flag: "r+",
    });
  } catch {
    return "";
  }
};

function createFileStorage(key: string): SyncStringStorage {
  const fileName = `./state/${key}.json`;
  let contents = readFile(fileName);
  let unsubscribe: NodeJS.Timeout | null = null;
  const scheduleWrite = () => {
    if (unsubscribe) {
      clearTimeout(unsubscribe);
    }

    unsubscribe = setTimeout(() => {
      writeFileSync(fileName, contents, {
        encoding: "utf-8",
        flag: "w",
      });
    }, 400);
  };
  const FileStorage: SyncStringStorage = {
    getItem() {
      return contents;
    },
    setItem(_, value) {
      contents = value;
      scheduleWrite();
    },
    removeItem() {
      contents = "";
      scheduleWrite();
    },
  };
  return FileStorage;
}

function entangledAtom<T>(key: string, atom: T) {
  const stringStorage = createFileStorage(key);
  const jsonStorage = createJSONStorage<T>(() => stringStorage);
  return atomWithStorage<T>(key, atom, jsonStorage, { getOnInit: true });
}

const storeAtom = entangledAtom<Store>("store", createSyncedStore());

export const isDarkModeAtom = focusAtom(storeAtom, (o) => o.prop("isDarkMode"));

export const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").optional().prop("anthropic"));
