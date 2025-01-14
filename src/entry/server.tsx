import { $, type Serve } from "bun";
import { hostname, port } from "../const";
import { DEBUG } from "../const/dynamic";
import { createFetch } from "../utils/handler";
import { doPOST, doSSE, doStatic, doStreamingSSR } from "./_handlers";
import { store } from "../store";
import { localCertAndKeyAtom } from "../atoms/common";

process.env.REALM = "ssr";

const tls = (await store.get(localCertAndKeyAtom))
  .map(({ cert, key }) => ({ cert: Bun.file(cert), key: Bun.file(key) }))
  .unwrapOr(undefined);

export default {
  development: DEBUG,
  hostname,
  port,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
  tls,
} satisfies Serve;
