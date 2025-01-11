import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import type { SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { Result, Task } from "true-myth";

import { getRealm } from "./realm";

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

export const getStoragePath = () => {
  if (Bun.env.STORAGE_PATH) {
    return Bun.env.STORAGE_PATH;
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

export async function resolve(module: string): Promise<Result<any, Error>> {
  if (getRealm() === "server") {
    return Result.ok(await import(module));
  }
  return Result.err(new Error("Cannot resolve modules in the browser"));
}

export async function spawn(command: string, args: string[], options?: any): Promise<Result<string, Error>> {
  const maybeModule = await resolve("child_process");

  if (maybeModule.isOk) {
    const module = maybeModule.value;
    const handle = module.spawn(command, args, options);

    return await new Task<string, Error>((ok, ko) => {
      handle.stdout.on("data", (data: unknown) => {
        ok(String(data).trim());
      });

      handle.stderr.on("data", (data: unknown) => {
        ko(new Error(String(data)));
      });

      handle.on("close", () => {
        ok("");
      });
    });
  }
  return Result.err(new Error("Cannot spawn processes in the browser"));
}
