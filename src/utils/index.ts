import type { SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { platform } from "node:os";
import { getRealm } from "./realm";
import { DEBUG } from "../const";

const readFile = (fileName: string) => {
  try {
    return readFileSync(fileName, {
      encoding: "utf-8",
      flag: "r+",
    });
  } catch (e) {
    console.error(e);
    return "";
  }
};

const getStoragePath = () => {
  if (DEBUG) {
    return "./state";
  }
  if (platform() === "win32") {
    const appData = Bun.env.APPDATA;
    if (!appData) {
      throw new Error("APPDATA not found");
    }
    if (!existsSync(`${appData}/experiment`)) {
      mkdirSync(`${appData}/experiment`, { recursive: true });
    }
    return `${appData}/experiment`;
  }
  const home = Bun.env.HOME;
  if (!home) {
    throw new Error("HOME not found");
  }
  if (!existsSync(`${home}/.experiment`)) {
    mkdirSync(`${home}/.experiment`, { recursive: true });
  }
  return `${home}/.experiment`;
};

export function createFileStorage(...keys: string[]): SyncStringStorage {
  const store = new Map<string, string>();
  const filenameForKey = (key: string) => `${getStoragePath()}/${key}.json`;
  for (const key of keys) {
    const fileName = filenameForKey(key);
    store.set(key, readFile(fileName));
  }
  const timeouts = new Map<string, Timer>();
  const scheduleWrite = (key: string) => {
    if (timeouts.has(key)) {
      clearTimeout(timeouts.get(key)!);
    }

    timeouts.set(
      key,
      setTimeout(() => {
        try {
          writeFileSync(filenameForKey(key), store.get(key)!, {
            encoding: "utf-8",
            flag: "w",
          });
        } catch (e) {
          console.error(e);
        }
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

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (const [key, value] of Object.entries(a)) {
    if (!deepEqual(value, b[key])) return false;
  }
  return true;
}

export function maybeImport(path: string) {
  if (getRealm() === "server") {
    return import(path);
  }
  return Promise.resolve({});
}
