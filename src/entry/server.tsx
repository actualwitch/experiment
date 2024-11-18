import { $, type Serve } from "bun";
import { DEBUG } from "../const";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";

const schema = "http";
const hostname = "localhost";
const port = 5173;
const url = `${schema}://${hostname}:${port}`;

if (process.env.OPEN_ON_START) {
  await $`open "${url}"`.quiet();
}

export default {
  development: DEBUG,
  hostname,
  port,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
} satisfies Serve;
