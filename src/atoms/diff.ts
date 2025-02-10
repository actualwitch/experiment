import { atom } from "jotai";
import { entangledAtom } from "../utils/entanglement";
import { getRealm } from "../utils/realm";
import { exec } from "../utils";

export const applyDiffAtom = entangledAtom(
  "apply-diff",
  atom(null, async (get, set, diff: string) => {
    try {
      const result = await exec("git apply", { input: diff + "\n\n" });
      return result;
    } catch (e) {
      console.error(e);
    }
  }),
);
