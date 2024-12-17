import { $ } from "bun";
import { VERSION } from "../src/const";

const TARGETS = ["linux-x64", "linux-arm64", "windows-x64", "darwin-x64", "darwin-arm64"];

// Build all targets
await Promise.all(
  TARGETS.map(
    (target) =>
      $`bun build --compile --minify --target=bun-${target}-modern ./src/entry/server.tsx --outfile ./build/experiment-${VERSION}-${target}`,
  ),
);

// Create archives with proper permissions
for (const target of TARGETS) {
  const binary = `./build/experiment-${VERSION}-${target}`;
  
  // Set executable permissions and remove quarantine for Mac binaries
  if (target.startsWith('darwin')) {
    await $`chmod +x ${binary}`;
    await $`xattr -d com.apple.quarantine ${binary} || true`;
  }
  
  // Create zip archive
  await $`zip -j ${binary}.zip ${binary}`;
  await $`rm ${binary}`;
}
