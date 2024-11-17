import { $ } from "bun";
import { getHtml } from "../src/entry/server.spa";
import { assignToWindow } from "../src/utils/hydration";

await $`bun build ./src/entry/client.spa.tsx --outdir ./spa`;

Bun.write(
  "./spa/index.html",
  getHtml(`${process.env.BASE_URL ?? ""}/client.spa.js`, [
    assignToWindow("REALM", `"SPA"`),
    process.env.BASE_URL && assignToWindow("BASE_URL", `"${process.env.BASE_URL}"`),
  ]),
);
