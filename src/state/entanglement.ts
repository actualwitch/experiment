import { atom, type Atom, type WritableAtom } from "jotai";
import { deepEqual, getRealm } from "../utils";
import { store } from "./common";
import { hydrationMap } from "../utils/hydration";
import type { PrimitiveAtom } from "jotai";
import { publish, subscribe } from "./æther";

const thisRealm = getRealm();
const isServer = thisRealm === "server";

type Config = {
  name: string;
  mode?: "server" | "readOnly";
};

type AtomWithWrite<V = unknown, A extends unknown[] = unknown[], R = any> = WritableAtom<V, A, R> | Atom<V>;
type AtomWitOnlyhWrite<V extends unknown = unknown, A extends unknown[] = unknown[], R = any> = WritableAtom<V, A, R>;

const uniqueIds = new Set<string>();

// todo infer type
export function entangledAtom<V extends unknown, A extends AtomWithWrite<V>, Aw extends AtomWitOnlyhWrite<V>>(
  c: string | Config,
  thisAtom: A,
) {
  const id = typeof c === "string" ? c : c.name;
  const mode = typeof c === "string" ? undefined : c.mode;
  if (uniqueIds.has(id)) {
    throw new Error(`entangledAtom id ${id} is not unique`);
  }
  uniqueIds.add(id);
  let writableAtom;
  if ("write" in thisAtom) {
    writableAtom = thisAtom;
  } else {
    const initialValue = store.get(thisAtom);
    writableAtom = atom(initialValue);
  }

  if (isServer) {
    let channelValue: any;

    const updater = () => {
      const value = store.get(writableAtom);
      hydrationMap[id] = value;

      if (channelValue === undefined || (channelValue && !deepEqual(channelValue, value))) {
        publish({ id, value });
      }
    };
    updater();
    store.sub(writableAtom, updater);

    subscribe((data) => {
      if (data.id === id) {
        channelValue = data.value;
        store.set(writableAtom, data.value);
      }
    });
  } else {
    const cacheValue = hydrationMap[id];
    if (cacheValue) {
      store.set(writableAtom, cacheValue as V);
    }
    if (mode === "server") {
      return atom(
        (get) => get(writableAtom),
        (get, set, update) => {
          fetch("/", {
            method: "POST",
            body: JSON.stringify({ id, value: update }),
          });
        },
      );
    }

    subscribe((data) => {
      if (data.id === id) {
        store.set(writableAtom, data.value);
      }
    });
    if (mode === "readOnly") {
      return atom((get) => get(writableAtom));
    }

    store.sub(writableAtom, () => {
      const value = store.get(writableAtom);
      fetch("/", {
        method: "POST",
        body: JSON.stringify({ id, value }),
      });
    });
  }
  return writableAtom;
}

export function serverAtom<V extends unknown, A extends unknown[], R extends unknown>(
  c: string | Config,
  thisAtom: WritableAtom<V, A, R>,
) {
  const id = typeof c === "string" ? c : c.name;
  if (uniqueIds.has(id)) {
    throw new Error(`entangledAtom id ${id} is not unique`);
  }
  uniqueIds.add(id);

  if (isServer) {
    subscribe(async (data) => {
      if (data.id === id) {
        if (data.id === id) {
          console.log("serverAtom", data);
          const value = await store.set(thisAtom, data.value);
        }
      }
    });
  } else {
    const writableAtom = atom<R | null>(null);
    subscribe((data) => {

      if (data.id === id && data.value !== null) {
        store.set(writableAtom, data.value);
      }
    });
    return atom(
      (get) => get(writableAtom),
      (get, set, update) => {
        return fetch("/", {
          method: "POST",
          body: JSON.stringify({ id, value: update }),
        });
      },
    );
  }
  return thisAtom;
}
