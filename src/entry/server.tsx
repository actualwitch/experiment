import { renderToReadableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Shell } from "../root";
import { eventStream } from "../utils/eventStream";
import { publish, subscribe, type Update } from "../state/æther";
import { DEBUG } from "../const";

const {
  outputs: [js],
  success,
  logs,
} = await Bun.build({
  entrypoints: ["src/entry/client.tsx"],
});
if (!success) {
  // throw new Error(logs.join("\n"));
  console.error(logs.join("\n"));
}

const doStatic = async (request: Request) => {
  const url = new URL(request.url);
  let response: Response | null = null;
  if (url.pathname === "/favicon.ico") {
    response = new Response("KO", { status: 404 });
  }
  if (url.pathname === "/script.js") {
    response = new Response(await js.text(), {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
  if (response) {
    console.log("Static", request.url);
  }
  return response;
};

const doStreamingSSR = async (request: Request) => {
  const url = new URL(request.url);
  console.log("SSR", request.url);
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
  console.log(request.method, request.url, body);
  publish(body);
  return new Response("OK");
};

const doSSE = async (request: Request) => {
  if (request.headers.get("accept") !== "text/event-stream") {
    return null;
  }
  console.log("SSE", request.url)
  return eventStream(request.signal, (send) => {
    const listener = (data: Update) => {
      console.log("SSE >>>", data);
      send({ data: JSON.stringify(data) });
    };
    const unsub = subscribe(listener);
    return () => {
      console.log("SSE closed")
      unsub();
    };
  });
};

async function appFetch(request: Request) {
  for (const handler of [doSSE, doPOST, doStatic, doStreamingSSR]) {
    const response = await handler(request);
    if (response) {
      return response;
    }
  }
  return new Response("Not Found", { status: 404 });
}

console.log("Listening on http://localhost:3000");
Bun.serve({
  development: DEBUG,
  fetch: appFetch,
});
