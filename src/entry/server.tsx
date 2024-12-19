import { $, type Serve } from "bun";
import { DEBUG, hostname, port, url } from "../const";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";
import { isMac } from "../utils/platform";

if (Bun.env.OPEN_ON_START && isMac()) {
  await $`open "${url}"`.quiet();
}

export default {
  development: DEBUG,
  hostname,
  port,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
} satisfies Serve;
