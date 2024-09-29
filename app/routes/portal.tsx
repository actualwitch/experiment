import { LoaderFunctionArgs } from "@remix-run/node";
import { createAction } from "~/createLoader";
import { eventStream } from "~/eventStream";
import { nanoid } from "nanoid";
import { atom } from "jotai";
import { store } from "~/state/common";

const portalIdsAtom = atom(new Set<string>());

const callbacksAtom = atom(new Map<string, (key: string, input: unknown) => void>());

export const sendKeyValAtom = atom(null, (get, set, [key, value]: [string, any]) => {
  console.log("sending", key, value);
  const callbacks = get(callbacksAtom);
  for (const portalId of get(portalIdsAtom)) {
    const callback = callbacks.get(portalId);
    callback?.(key, value);
  }
});

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.headers.get("accept") !== "text/event-stream") {
    return new Response("only event-stream supported", { status: 400 });
  }
  return eventStream(request.signal, function setup(send) {
    const portalId = nanoid();
    const portalIds = store.get(portalIdsAtom);
    portalIds.add(portalId);
    const callbacks = store.get(callbacksAtom);
    callbacks.set(portalId, (key, val) => {
      send({ data: JSON.stringify(val), event: key });
    });
    console.log("opening portal", portalId);
    return () => {
      console.log("closing portal", portalId);
      portalIds.delete(portalId);
      callbacks.delete(portalId);
    };
  });
}

// export const action = createAction(entangledAtoms);
