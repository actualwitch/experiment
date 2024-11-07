import { atom, type Atom, type WritableAtom } from "jotai";
import { getRealm } from "../utils";
import { hydrationMap } from "../utils/hydration";
import { store } from "./common";
import { publish, subscribe } from "./æther";

type Config = {
  name: string;
};

export function divergentAtom<T extends Atom<unknown> | WritableAtom<unknown, unknown[], unknown>>(
  ...cases: Array<() => T | undefined>
) {
  let result: T | undefined;
  for (const c of cases) {
    result = c();
    if (result) break;
  }
  if (!result) throw new Error("No atom was created");
  return result;
}
export function entangledAtom<
  _V extends any,
  V extends _V,
  A extends [_V],
  R extends unknown,
  T extends WritableAtom<V, A, R>,
>(c: string | Config, thisAtom: T): WritableAtom<V, A, R>;
export function entangledAtom<
  _V extends any,
  V extends Promise<_V>,
  A extends [_V],
  R extends unknown,
  T extends WritableAtom<V, A, R>,
>(c: string | Config, thisAtom: T): WritableAtom<V, A, R> {
  const id = typeof c === "string" ? c : c.name;
  return divergentAtom(
    () => {
      if (getRealm() !== "server") {
        return undefined;
      }

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

      return thisAtom;
    },
    () => {
      if (thisAtom.init === null) {
        return atom(null, (get, set, update) => {
          fetch("/", {
            method: "POST",
            body: JSON.stringify({ id, value: update }),
          });
        });
      }

      const requestUpdate = (update: unknown) =>
        fetch("/", {
          method: "POST",
          body: JSON.stringify({ id, value: update }),
        });

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
          requestUpdate(update);
        },
      );
    },
  );
}


/// test cases

// const test1 = entangledAtom("test1", atom(1));
// const test2 = entangledAtom("test2", atom(get => get(test1)));
// const test3 = entangledAtom("test3", atom(get => get(test1), (get, set, update) => set(test1, update)));
// const test4 = entangledAtom("test4", null, (get, set, update) => set(test1, update));
// const test5 = entangledAtom("test5", atom(async get => get(test1)));
// const test6 = entangledAtom("test6", atom(null, async (get, set, update) => set(test1, update)));