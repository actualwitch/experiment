import { $ } from "bun";
import { name, description, iconResolutions } from "../src/const";
import { getHtml } from "../src/entry/_handlers";
import { getManifest } from "../src/feature/pwa/manifest";
import { ROUTES } from "../src/feature/router";
import { assignToWindow } from "../src/utils/hydration";

// why does this work but running it from Bun.build fails? #justbunthings
await $`bun build ./src/entry/client.tsx --outdir ./spa --minify`;
// const buildResult = await Bun.build({
//   entrypoints: ["./src/entry/client.tsx"],
//   outdir: "./spa",
// });
// if (!buildResult.success) {
//   throw new AggregateError(buildResult.logs, "Build failed");
// }

const baseUrl = process.env.BASE_URL;
const regex = /\/\w*/gm;

for (const route of ROUTES) {
  const path = route.path.match(regex)?.[0] ?? "/";
  const pathname = path === "/" ? "index" : path.slice(1);
  const fullUrl = `${baseUrl ?? ""}${path}`;

  const html = getHtml(
    fullUrl,
    [assignToWindow("REALM", `"SPA"`), baseUrl && assignToWindow("BASE_URL", `"${baseUrl}"`)],
    baseUrl,
  );

  await Bun.write(`./spa/${pathname}.html`, html);
}

await Bun.write(
  "./spa/manifest.json",
  JSON.stringify(getManifest(name, description, iconResolutions, baseUrl), null, 2),
);

for (const res of iconResolutions) {
  await $`cp ./.github/assets/experiment-${res}.png ./spa`;
}
