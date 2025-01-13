import { $, type Serve } from "bun";
import { hostname, port } from "../const";
import { DEBUG } from "../const/dynamic";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";
import { isMac } from "../utils/platform";
import { store } from "../store";
import { localCertAndKeyAtom } from "../atoms/common";

const certAndKey = await store.get(localCertAndKeyAtom);

if (Bun.env.OPEN_ON_START && isMac()) {
  const url = `${certAndKey.isOk ? "https" : "http"}://${hostname}:${port}`;
  await $`open "${url}"`.quiet();
}

export default {
  development: DEBUG,
  hostname,
  port,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
  tls: certAndKey.map(({ cert, key }) => ({ cert: Bun.file(cert), key: Bun.file(key) })).unwrapOr(undefined),
} satisfies Serve;
