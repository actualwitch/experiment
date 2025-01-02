import { $ } from "bun";
import project from "../package.json";
import { getHtml } from "../src/entry/_handlers";
import { assignToWindow } from "../src/utils/hydration";
import { Palette } from "../src/style/palette";

// why does this work but running it from Bun.build fails? #justbunthings
await $`bun build ./src/entry/client.tsx --outdir ./spa`;
// const buildResult = await Bun.build({
//   entrypoints: ["./src/entry/client.tsx"],
//   outdir: "./spa",
// });
// if (!buildResult.success) {
//   throw new AggregateError(buildResult.logs, "Build failed");
// }

const baseUrl = process.env.BASE_URL;
const fullUrl = `${baseUrl ?? ""}/`;

const html = getHtml(
  fullUrl,
  [assignToWindow("REALM", `"SPA"`), baseUrl && assignToWindow("BASE_URL", `"${baseUrl}"`)],
  baseUrl,
);

await Bun.write("./spa/index.html", html);

const resolutions = [128, 192, 256, 512, 1024];

await Bun.write(
  "./spa/manifest.json",
  JSON.stringify({
    name: project.name,
    start_url: fullUrl,
    display: "standalone",
    description: project.description,
    background_color: Palette.white,
    theme_color: Palette.black,
    icons: resolutions.map((res) => ({
      src: `experiment-${res}.png`,
      sizes: `${res}x${res}`,
      type: "image/png",
      purpose: "maskable",
    })),
  }),
);

for (const res of resolutions) {
  await $`cp ./.github/assets/experiment-${res}.png ./spa`;
}