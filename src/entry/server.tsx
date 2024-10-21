import { renderToReadableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Shell } from "../root";
import { eventStream } from "../utils/eventStream";
import { publish, subscribe, type Update } from "../state/æther";



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
  if (url.pathname === "/favicon.ico") {
    return new Response("KO", { status: 404 });
  }
  if (url.pathname === "/script.js") {
    return new Response(await js.text(), {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
  return null;
};

const doStreamingSSR = async (request: Request) => {
  const url = new URL(request.url);
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
  publish(body);
  return new Response("OK");
};

const doSSE = async (request: Request) => {
  if (request.headers.get("accept") !== "text/event-stream") {
    return null;
  }
  return eventStream(request.signal, (send) => {
    const listener = (data: Update) => {
      console.log("sending sse", data);
      send({ data: JSON.stringify(data) });
    };
    const unsub = subscribe(listener);
    return () => {
      unsub();
    };
  });
};

async function appFetch(request: Request) {
  console.log(request.method, request.url);
  for (const handler of [doStatic, doSSE, doPOST, doStreamingSSR]) {
    const response = await handler(request);
    if (response) {
      return response;
    }
  }
  return new Response("Not Found", { status: 404 });
}

console.log("Listening on http://localhost:3000");
Bun.serve({
  development: true,
  fetch: appFetch,
});
