import { $ } from "bun";
import { getHtml } from "../src/entry/_handlers";
import { assignToWindow } from "../src/utils/hydration";

// why does this work but running it from Bun.build fails? #justbunthings
await $`bun build ./src/entry/client.tsx --outdir ./spa`;
// const buildResult = await Bun.build({
//   entrypoints: ["./src/entry/client.tsx"],
//   outdir: "./spa",
// });
// if (!buildResult.success) {
//   throw new AggregateError(buildResult.logs, "Build failed");
// }

const html = getHtml(
  `${process.env.BASE_URL ?? ""}/`,
  [assignToWindow("REALM", `"SPA"`), process.env.BASE_URL && assignToWindow("BASE_URL", `"${process.env.BASE_URL}"`)],
  process.env.BASE_URL,
);

await Bun.write(
  "./spa/index.html",
  html,
);
