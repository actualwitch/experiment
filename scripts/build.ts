import { $ } from "bun";
import { VERSION } from "../src/const";

const TARGETS = ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"];

await Promise.all(
  TARGETS.map(
    (target) =>
      $`bun build --compile --target=bun-${target}-modern ./src/entry/server.tsx --outfile ./build/experiment-${VERSION}-${target}`,
  ),
);
