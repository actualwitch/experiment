import { $ } from "bun";
import { revisionAtom } from "../src/atoms/common";
import { store } from "../src/store";

$`rm -rf ./build`;

const revision = await store.get(revisionAtom);

for (const target of ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"]) {
  await $`bun build --compile --minify --target=bun-${target}-modern ./src/entry/bin.tsx --outfile ./build/experiment-${revision}-${target}`;
}
