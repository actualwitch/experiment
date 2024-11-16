import { $, type Serve } from "bun";
import { DEBUG } from "../const";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";

const url = "http://localhost:3000";

if (process.env.OPEN_ON_START) {
  await $`open "${url}"`.quiet();
  console.log(process.env)
}

export default {
  development: DEBUG,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
} satisfies Serve;
