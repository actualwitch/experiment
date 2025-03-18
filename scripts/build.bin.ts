import { $ } from "bun";
import { REVISION } from "../src/const/dynamic";

$`rm -rf ./build`;

for (const target of ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"]) {
  await $`bun build --compile --minify --target=bun-${target}-modern ./src/entry/bin.tsx --outfile ./build/experiment-${REVISION}-${target}`;
}
