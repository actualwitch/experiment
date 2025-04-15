import { $ } from "bun";
import { name, description, iconResolutions, staticDir, clientFile, clientCss } from "../src/const";
import { getStaticHtml } from "../src/entry/_handlers";
import { getManifest } from "../src/feature/pwa/manifest";
import { ROUTES } from "../src/feature/router";
import { assignToWindow } from "../src/utils/hydration";
import { getClientAsString } from "../src/entry/_macro" with { type: "macro" };
import { setRealm } from "../src/utils/realm";

$`rm -rf ./${staticDir}`;

const baseUrl = process.env.BASE_URL;
const regex = /\/\w*/gm;

setRealm("ssg");

for (const route of ROUTES) {
  const path = route.path.match(regex)?.[0] ?? "/";
  const pathname = path === "/" ? "index" : path.slice(1);
  const fullUrl = `${baseUrl ?? ""}${path}`;

  const html = await getStaticHtml(
    fullUrl,
    [assignToWindow("REALM", `"SSG"`), baseUrl && assignToWindow("BASE_URL", `"${baseUrl}"`)],
    baseUrl,
  );

  await Bun.write(`./${staticDir}/${pathname}.html`, html);
}

await Bun.write(
  `./${staticDir}/manifest.json`,
  JSON.stringify(getManifest(name, description, iconResolutions, baseUrl), null, 2),
);

const [clientFileContent, css] = await getClientAsString();
await Bun.write(`./${staticDir}${clientFile}`, clientFileContent.text);
await Bun.write(`./${staticDir}${clientCss}`, css.text);

await $`cp ./.github/assets/experiment.png ./${staticDir}`;
for (const res of iconResolutions) {
  await $`cp ./.github/assets/experiment-${res}.png ./${staticDir}`;
}
