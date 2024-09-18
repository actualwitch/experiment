import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { entangledAtoms, store } from "~/state/common";
interface SendFunctionArgs {
  /**
   * @default "message"
   */
  event?: string;
  data: string;
}

type SendFunction = (args: SendFunctionArgs) => void;

type CleanupFunction = () => void;

type AbortFunction = () => void;

type InitFunction = (send: SendFunction, abort: AbortFunction) => CleanupFunction;

/**
 * A response helper to use Server Sent Events server-side
 * @param signal The AbortSignal used to close the stream
 * @param init The function that will be called to initialize the stream, here you can subscribe to your events
 * @returns A Response object that can be returned from a loader
 */
export function eventStream(signal: AbortSignal, init: InitFunction, options: ResponseInit = {}) {
  let stream = new ReadableStream({
    start(controller) {
      let encoder = new TextEncoder();

      function send({ event = "message", data }: SendFunctionArgs) {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      let cleanup = init(send, close);

      let closed = false;

      function close() {
        if (closed) return;
        cleanup();
        closed = true;
        signal.removeEventListener("abort", close);
        controller.close();
      }

      signal.addEventListener("abort", close);

      if (signal.aborted) return close();
    },
  });

  let headers = new Headers(options.headers);

  if (headers.has("Content-Type")) {
    console.warn("Overriding Content-Type header to `text/event-stream`");
  }

  if (headers.has("Cache-Control")) {
    console.warn("Overriding Cache-Control header to `no-cache`");
  }

  if (headers.has("Connection")) {
    console.warn("Overriding Connection header to `keep-alive`");
  }

  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache");
  headers.set("Connection", "keep-alive");

  return new Response(stream, { headers });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.headers.get("accept") !== "text/event-stream") {
    return json({});
  }
  return eventStream(request.signal, function setup(send) {
    const unsubMap = new Map<string, () => void>();
    for (const [key, atom] of Object.entries(entangledAtoms)) {
      const unsub = store.sub(atom, () => {
        const data = store.get(atom as any);
        send({ data: JSON.stringify(data), event: key });
      });
      unsubMap.set(key, unsub);
    }

    return () => {
      for (const unsub of unsubMap.values()) {
        unsub();
      }
    };
  });
}

const sseSubscriptionEffect = atomEffect((get, set) => {
  const source = new EventSource("/portal");
  for (const keyVal of Object.entries(entangledAtoms)) {
	const [key, atom] = keyVal;
	source.addEventListener(key, (event) => {
	  set(atom as any, JSON.parse(event.data));
	});
  }
  return () => {
	source.close();
  }
});

export default function Portal() {
  useAtom(sseSubscriptionEffect);
  return (
    <div>
      <h1>Portal</h1>
    </div>
  );
}