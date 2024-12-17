import { $ } from "bun";
import { VERSION } from "../src/const";

const TARGETS = ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"];

// Build all targets
await Promise.all(
  TARGETS.map(async (target) => {
    const binary = `./build/experiment-${VERSION}-${target}`;
    await $`bun build --compile --minify --target=bun-${target}-modern ./src/entry/server.tsx --outfile ${binary}`;

    // Set executable permissions for Darwin/Linux binaries
    if (!target.startsWith("windows")) {
      await $`chmod +x ${binary}`;
    }

    // Remove quarantine for Mac binaries
    // if (target.startsWith("darwin")) {
    //   await $`xattr -d com.apple.quarantine ${binary} || true`;
    // }
  
    // Create zip archive
    const filename = target.startsWith("windows") ? `${binary}.exe` : binary;
    await $`zip -j ${binary}.zip ${filename}`;
    await $`rm ${filename}`;
  }),
);