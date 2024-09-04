import { SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { readFileSync, writeFileSync } from "node:fs";

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

export function createFileStorage(...keys: string[]): SyncStringStorage {
  const store = new Map<string, string>();
  const filenameForKey = (key: string) => `./state/${key}.json`;
  for (const key of keys) {
    const fileName = filenameForKey(key);
    store.set(key, readFile(fileName));
  }
  const timeouts = new Map<string, NodeJS.Timeout>();
  const scheduleWrite = (key: string) => {
    if (timeouts.has(key)) {
      clearTimeout(timeouts.get(key)!);
    }

    timeouts.set(
      key,
      setTimeout(() => {
        writeFileSync(filenameForKey(key), store.get(key)!, {
          encoding: "utf-8",
          flag: "w",
        });
      }, 400),
    );
  };

  const FileStorage: SyncStringStorage = {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
      scheduleWrite(key);
    },
    removeItem(key) {
      store.delete(key);
      scheduleWrite(key);
    },
  };
  return FileStorage;
}
