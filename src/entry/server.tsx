import { $, type Server } from "bun";
import { renderToReadableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { DEBUG } from "../const";
import { Shell } from "../root";
import { publish, subscribe, type Update } from "../state/æther";
import { eventStream } from "../utils/eventStream";

import { getClientAsString } from "./_macro" with { type: "macro" };
import { log } from "../logger";

const doStatic = async (request: Request) => {
  const url = new URL(request.url);
  let response: Response | null = null;
  if (url.pathname === "/favicon.ico") {
    response = new Response("KO", { status: 404 });
  }
  if (url.pathname === "/script.js") {
    response = new Response(await getClientAsString(), {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
  if (response) {
    log("Static", request.url);
  }
  return response;
};

const doStreamingSSR = async (request: Request) => {
  const url = new URL(request.url);
  log("SSR", request.url);
  const stream = await renderToReadableStream(
    <StaticRouter location={url.pathname}>
      <Shell />
    </StaticRouter>,

    {
      signal: request.signal,
      onError(error: unknown) {
        // Log streaming rendering errors from inside the shell
        console.error(error);
      },
      bootstrapModules: ["/script.js"],
    }
  );
  await stream.allReady;
  return new Response(stream, {
    headers: {
      "Content-Type": "text/html",
    },
  });
};

const doPOST = async (request: Request) => {
  if (request.method !== "POST") {
    return null;
  }
  const body = await request.json();
  log(request.method, request.url, body);
  publish(body);
  return new Response("OK");
};

const doSSE = async (request: Request, server: Server) => {
  if (request.headers.get("accept") !== "text/event-stream") {
    return null;
  }
  log("SSE", request.url)
  server.timeout(request, 1000 * 60 * 60);
  return eventStream(request.signal, (send) => {
    const listener = (data: Update) => {
      log("SSE >>>", data);
      send({ data: JSON.stringify(data) });
    };
    const unsub = subscribe(listener);
    return () => {
      log("SSE closed")
      unsub();
    };
  });
};

function createFetch<T extends (request: Request, server: Server) => Response | null | Promise<Response | null>>(...handlers: T[]) {
  return async (request: Request, server: Server) => {
    for (const handler of handlers) {
      const response = await handler(request, server);
      if (response) {
        return response;
      }
    }
    return new Response("Not Found", { status: 404 });
  };
}

const url = "http://localhost:3000";

console.log("Listening on " + url);
await $`open ${url}`.quiet();

Bun.serve({
  development: DEBUG,
  fetch: createFetch(doSSE, doPOST, doStatic, doStreamingSSR),
});
