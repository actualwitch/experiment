import { $ } from "bun";
import { getHtml } from "../src/entry/server.spa";

await $`bun build ./src/entry/client.spa.tsx --outdir ./spa`;

Bun.write("./spa/index.html", getHtml(`${process.env.BASE_URL ?? ""}/client.spa.js`));
