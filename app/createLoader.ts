import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "./eventStream";
import { store } from "./state/common";
import { DEBUG } from "./const";

export function createLoader<T extends object>(atoms: T) {
  return async function loader({ request }: LoaderFunctionArgs) {
    let values: Partial<Record<keyof typeof atoms, any>> = {};
    for (const [key, atom] of Object.entries(atoms)) {
      values[key as keyof typeof atoms] = store.get(atom as any);
    }
    if (DEBUG) {
      console.log("server>batch", values);
    }
    return json(values);
  };
}

export function createStreamLoader<T extends object>(atoms: T) {
  return async function loader({ request }: LoaderFunctionArgs) {
    if (request.headers.get("accept") !== "text/event-stream") {
      throw new Error("This loader only supports event-stream requests");
    }
    return eventStream(request.signal, function setup(send) {
      const unsubMap = new Map<string, () => void>();
      for (const [key, atom] of Object.entries(atoms)) {
        const unsub = store.sub(atom, () => {
          const data = store.get(atom as any);
          if (DEBUG) {
            console.log("server>stream", { event: key });
          }
          send({ data: JSON.stringify(data), event: key });
        });
        unsubMap.set(key, unsub);
        const data = store.get(atom as any);
        send({ data: JSON.stringify(data), event: key });
      }

      return () => {
        for (const unsub of unsubMap.values()) {
          unsub();
        }
      };
    });
  };
}

export function createAction<T extends object>(atoms: T) {
  return async ({ request }: ActionFunctionArgs) => {
    const body = await request.json();
    for (const [key, atom] of Object.entries(atoms)) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (DEBUG) {
          console.log("server>action", { [key]: body[key] });
        }
        await store.set(atom as any, ...body[key]);
      }
    }
    return json({ result: "ok" });
  };
}
