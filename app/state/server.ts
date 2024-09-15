import { spawn } from "child_process";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { createFileStorage } from "~/utils";
import { bindToRealm, getInitialStore, tokenAtom } from "./common";
import { getRealm } from "./entanglement";

export const resolvedTokenAtom = atom<Promise<string | null>>(async (get) => {
  const reference = get(tokenAtom);
  if (!reference) return null;
  const handle = spawn("op", ["read", reference]);
  return await new Promise((ok, ko) => {
    handle.stdout.on("data", (data) => {
      const token = data.toString();
      ok(token.trim());
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

bindToRealm({
  storeAtom: atomWithStorage(
    "store",
    getInitialStore(),
    createJSONStorage(() => createFileStorage("store")),
    {
      getOnInit: getRealm() === "server",
    },
  ),
});
