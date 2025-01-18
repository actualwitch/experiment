import { $ } from "bun";
import { name, description, iconResolutions, staticDir } from "../src/const";
import { getStaticHtml } from "../src/entry/_handlers";
import { getManifest } from "../src/feature/pwa/manifest";
import { ROUTES } from "../src/feature/router";
import { assignToWindow } from "../src/utils/hydration";
import { store } from "../src/store";
import { clientScriptAtom } from "../src/atoms/server";

const result = await store.get(clientScriptAtom);
if (result.isNothing) {
  throw new Error("could not build frontend");
}
const baseUrl = process.env.BASE_URL;
const regex = /\/\w*/gm;

for (const route of ROUTES) {
  const path = route.path.match(regex)?.[0] ?? "/";
  const pathname = path === "/" ? "index" : path.slice(1);
  const fullUrl = `${baseUrl ?? ""}${path}`;

  const html = await getStaticHtml(
    fullUrl,
    [assignToWindow("REALM", `"SPA"`), baseUrl && assignToWindow("BASE_URL", `"${baseUrl}"`)],
    baseUrl,
  );

  await Bun.write(`./${staticDir}/${pathname}.html`, html);
}

await Bun.write(
  `./${staticDir}/manifest.json`,
  JSON.stringify(getManifest(name, description, iconResolutions, baseUrl), null, 2),
);

for (const res of iconResolutions) {
  await $`cp ./.github/assets/experiment-${res}.png ./${staticDir}`;
}
