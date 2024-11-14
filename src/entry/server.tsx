import { $, type Serve } from "bun";
import { DEBUG } from "../const";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";

const url = "http://localhost:3000";
await $`open "${url}"`.quiet();

export default {
  development: DEBUG,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
} satisfies Serve;
