import { Atom, atom, Getter, Setter } from "jotai";
import { INTERNAL_PrdStore } from "jotai/vanilla/store";
import { useEffect, useRef } from "react";
import { createMessageHandler, store } from "./common";
import worker from "./entanglement.worker?worker";

export const getRealm = () => {
  if (typeof window !== "undefined") {
    return "client";
  }
  if (typeof process === "object") {
    return "server";
  }
  // @ts-ignore
  if (typeof importScripts === "function") {
    return "worker";
  }
  throw new Error("Unknown realm");
};

export type Realm = ReturnType<typeof getRealm>;

export const realmHierarchy: Realm[] = ["client", "worker", "server"];

export const REALM = Symbol.for("realm");

export const realmAtom = atom(() => getRealm());

export function entangleAtoms<T extends object, EntangledAtomKey extends keyof T>(
  config: { [REALM]: Atom<Realm> } & {
    [K in EntangledAtomKey]: T[K];
  },
) {
  const { [REALM]: realmAtom, ...restConfig } = config;
  const overrides = atom<
    Partial<{
      [K in EntangledAtomKey]: Atom<T[K]>;
    }>
  >({});
  const entangledAtoms = Object.fromEntries(
    Object.entries(restConfig).map(([key, defaultAtom]) => {
      const writableAtom = atom(
        (get) => {
          const realm = get(realmAtom);
          const o: any = get(overrides);
          return get(o[key] ?? defaultAtom);
        },
        (get: Getter, set: Setter, props: any[]) => {
          const o: any = get(overrides);
          const thisAtom = o[key] ?? defaultAtom;
          set(thisAtom, props);
        },
      );
      return [key, writableAtom];
    }),
  ) as unknown as {
    [K in Exclude<EntangledAtomKey, typeof REALM>]: T[K];
  };

  function bindToRealm<T>(config: T
    
  ) {
    store.set(overrides, (prev) => ({
      ...prev,
      ...config,
    }));

    return entangledAtoms;
  }
  const createMessageHandler = (store: INTERNAL_PrdStore) => {
    return (event: MessageEvent) => {
      Object.entries(event.data).forEach(async ([key, value]) => {
        if (Reflect.has(entangledAtoms, key)) {
          // @ts-ignore
          const atom = entangledAtoms[key];
          if (!atom) return;
          const thisValue = await store.get(atom);
          if (thisValue !== value) {
            globalThis.postMessage({ [key]: thisValue });
          }
        }
      });
    };
  };

  return {
    entangledAtoms,
    bindToRealm,
    createMessageHandler,
  };
}

export const useWorker = () => {
  const ref = useRef<Worker | null>(null);
  useEffect(() => {
    const handle = new worker();
    ref.current = handle;
    handle.onerror = (event) => {
    };
    handle.onmessage = createMessageHandler(store);
    return () => {
      handle.terminate();
    };
  }, []);

  return ref.current?.postMessage;
};
