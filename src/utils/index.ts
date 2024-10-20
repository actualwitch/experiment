import { atom, useAtomValue, useSetAtom, type WritableAtom } from "jotai";
import { type ReactNode, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { type SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { readFileSync, writeFileSync } from "node:fs";

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

export function createFileStorage(...keys: string[]): SyncStringStorage {
  const store = new Map<string, string>();
  const filenameForKey = (key: string) => `./state/${key}.json`;
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


export const getRealm = () => {
  if (typeof document !== "undefined") {
    return "client";
  }
  if (typeof process === "object") {
    return "server";
  }
  // @ts-ignore
  if (typeof importScripts === "function") {
    return "worker";
  }
  throw new Error("Unknown realm");
};

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (const [key, value] of Object.entries(a)) {
    if (!deepEqual(value, b[key])) return false;
  }
  return true;
}