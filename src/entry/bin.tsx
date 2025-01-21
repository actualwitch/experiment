import type { Serve } from "bun";
import { debugAtom } from "../atoms/common";
import { clientScriptAtom } from "../atoms/server";
import { clientFile, description, hostname, iconResolutions, name, port } from "../const";
import { getManifest } from "../feature/pwa/manifest";
import { store } from "../store";
import { createFetch } from "../utils/handler";
import { log } from "../utils/logger";
import { doPOST, doSSE, doStreamingSSR } from "./_handlers";
import { Maybe } from "true-myth";
import { getClientAsString } from "./_macro" with { type: "macro" };

export default {
  development: store.get(debugAtom),
  hostname,
  port,
  fetch: createFetch(
    doSSE,
    doPOST,
    async (request: Request) => {
      const url = new URL(request.url);
      let response: Response | null = null;
      if (url.pathname === "/favicon.ico") {
        response = new Response("KO", { status: 404 });
      }
      if (url.pathname === "/manifest.json") {
        response = new Response(JSON.stringify(getManifest(name, description, iconResolutions)), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      if (url.pathname === clientFile) {
        const clientScript = Maybe.just(await getClientAsString());
        response = clientScript.match({
          Just: (script) => new Response(script, { headers: { "Content-Type": "application/javascript" } }),
          Nothing: () => new Response("KO", { status: 500 }),
        });
      }
      if (response) {
        log("Static", request.url);
      }
      return response;
    },
    doStreamingSSR,
  ),
} satisfies Serve;
