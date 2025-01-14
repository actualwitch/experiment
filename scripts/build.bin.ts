import { $ } from "bun";
import { VERSION } from "../src/const/dynamic";

const TARGETS = ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"];

$`rm -rf ./build`;

// Build all targets
await Promise.all(
  TARGETS.map(
    (target) =>
      $`bun build --compile --minify --target=bun-${target}-modern ./src/entry/server.tsx --outfile ./build/experiment-${VERSION}-${target}`,
  ),
);

