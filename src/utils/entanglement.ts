import { atom, type Atom, type WritableAtom } from "jotai";
import { hydrationMap } from "./hydration";
import { store } from "../store";
import { publish, subscribe } from "./æther";
import { getRealm } from "./realm";

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
  _V,
  V extends _V | Promise<_V>,
  A extends [_V],
  R,
  T extends Atom<V> | WritableAtom<V, A, R>,
>(c: string | Config, thisAtom: T): T {
  const id = typeof c === "string" ? c : c.name;
  return divergentAtom(
    () => {
      if (getRealm() !== "testing") {
        return undefined;
      }
      const cacheValue = hydrationMap[id] as unknown as V;
      if (cacheValue !== undefined) {
        return atom(cacheValue);
      }
      return thisAtom;
    },
    () => {
      if (getRealm() !== "ssg") {
        return undefined;
      }
      return thisAtom;
    },
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
        if (Array.isArray(value) && Array.isArray(channelValue) && channelValue.length === 0 && value.length === 0) {
        } else {
          publish({ id, value });
        }
        channelValue = value;
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
      if (cacheValue !== undefined) {
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
        (get) => get(writableAtom),
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
// const test4 = entangledAtom("test4", atom(null, (get, set, update) => set(test1, update)));
// const test5 = entangledAtom("test5", atom(async get => get(test1)));
// const test6 = entangledAtom("test6", atom(null, async (get, set, update) => set(test1, update)));
