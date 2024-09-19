import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { store } from "./state/common";

export function createSubscription<T extends object>(url: string, atoms: T) {
  return atomEffect((get, set) => {
    const source = new EventSource(url);
    for (const keyVal of Object.entries(atoms)) {
      const [key, atom] = keyVal;
      source.addEventListener(key, (event) => {
        console.log(`${url}>client/sse`, {[key]: JSON.parse(event.data)});
        setTimeout(() => {

        store.set(atom as any, JSON.parse(event.data));
        }, 100);
      });
    }
    source.onerror = (event) => {
      console.error(event);
    };
    return () => {
      source.close();
    };
  });
}
