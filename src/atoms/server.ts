import { atom } from "jotai";
import { Maybe } from "true-myth";
import { resolve, spawn } from "../utils";
import { clientFile, staticDir } from "../const";

export const clientScriptAtom = atom(async () => {
  const result = await spawn("bun", [
    "build",
    "./src/entry/client.tsx",
    "--outdir",
    `./${staticDir}`,
    "--minify",
  ]);
  if (result.isErr) {
    console.error(result.error);
    return Maybe.nothing();
  }
  const fs = await resolve("fs/promises");
  const readFile = fs.map((fs) => fs.readFile);
  if (readFile.isErr) {
    console.error(readFile.error);
    return Maybe.nothing();
  }
  const file = await readFile.value(`./${staticDir}/${clientFile}`, "utf8");
  return Maybe.just(file);
});
