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
