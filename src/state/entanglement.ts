import { atom, type WritableAtom } from "jotai";
import { deepEqual, getRealm } from "../utils";
import { publish, subscribe } from "./æther";
import { store } from "./common";
import { hydrationMap } from "../utils/hydration";
import { log } from "../logger";

const thisRealm = getRealm();
const isServer = thisRealm === "server";

type Config = {
  name: string;
};

export function entangledAtom<
  _V extends any,
  V extends _V | Promise<_V>,
  A extends [_V],
  R extends unknown,
  T extends WritableAtom<V, A, R>,
>(c: string | Config, thisAtom: T): WritableAtom<V, A, R> {
  const id = typeof c === "string" ? c : c.name;
  if (isServer) {
    if (thisAtom.init === null) {
      subscribe((data) => {
        if (data.id === id) {
          try {
            store.set(thisAtom, data.value);
          } catch (e) {
            console.error(e);
          }
        }
      });
      return thisAtom;
    }
    let channelValue: any;

    const updater = async () => {
      const value = await store.get(thisAtom);
      hydrationMap[id] = value;
      publish({ id, value });
    };
    updater();
    store.sub(thisAtom, updater);

    if (thisAtom.write) {
      subscribe((data) => {
        if (data.id === id) {
          try {
            channelValue = data.value;
            store.set(thisAtom, data.value);
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  } else {
    if (thisAtom.init === null) {
      return atom(null, (get, set, update) => {
        fetch("/", {
          method: "POST",
          body: JSON.stringify({ id, value: update }),
        });
      });
    }

    let writableAtom: WritableAtom<V, A, R>;
    const cacheValue = hydrationMap[id] as unknown as V;
    if (cacheValue) {
      writableAtom = atom(cacheValue);
    } else {
      writableAtom = atom(
        (get) => get(thisAtom),
        (get, set, ...update) => {
          store.set(thisAtom, ...update);
        },
      );
    }

    subscribe((data) => {
      if (data.id === id) {
        store.set(writableAtom, data.value);
      }
    });
    return atom(
      async (get) => get(writableAtom),
      (get, set, update) => {
        fetch("/", {
          method: "POST",
          body: JSON.stringify({ id, value: update }),
        });
      },
    );
  }
  return thisAtom;
}
