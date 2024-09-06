import { atom, createStore } from "jotai";
import { createJSONStorage } from "jotai/utils";
import { Store, initAtoms } from "./common";
import { spawn } from "child_process";
import { createFileStorage } from "../utils";

export const store = createStore();
const stringStorage = createFileStorage("store");
const jsonStorage = createJSONStorage<Store>(() => stringStorage);

export const { storeAtom, isDarkModeAtom, tokenAtom } = initAtoms(jsonStorage);

export const resolvedTokenAtom = atom(async (get) => {
  const reference = get(tokenAtom);
  if (!reference) return null;
  const handle = spawn("op", ["read", reference]);
  return await new Promise((ok, ko) => {
    handle.stdout.on("data", (data) => {
      const token = data.toString();
      ok(token);
    });

    handle.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    handle.on("close", (code) => {
      console.error(code);
      ok(null);
    });
  });
});

export const hasResolvedTokenAtom = atom(async (get) => {
  const token = await get(resolvedTokenAtom);
  return Boolean(token);
});
