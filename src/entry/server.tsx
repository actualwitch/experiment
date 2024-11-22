import { $, type Serve } from "bun";
import { DEBUG, hostname, port, url } from "../const";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";

if (process.env.OPEN_ON_START) {
  await $`open "${url}"`.quiet();
}

export default {
  development: DEBUG,
  hostname,
  port,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
} satisfies Serve;
