import { Atom, atom, Getter, Setter } from "jotai";
import { focusAtom } from "jotai-optics";
import { INTERNAL_PrdStore } from "jotai/vanilla/store";
import { useEffect, useRef } from "react";
import {  store } from "./common";
import worker from "./entanglement.worker?worker";
import { atomEffect } from "jotai-effect";
export const getRealm = () => {
  if (typeof document !== "undefined") {
    return "client";
  }
  if (typeof process === "object") {
    return "server";
  }
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
  const { [REALM]: realmAtom, ..._restConfig } = config;
  const restConfig = _restConfig as unknown as { [K in EntangledAtomKey]: T[K] };
  const realmOverridesAtom = atom<
    Partial<{
      [K in Realm]: Partial<{
        [K in EntangledAtomKey]: Atom<T[K]>;
      }>;
    }>
  >({});
  const entangledAtoms = Object.fromEntries(
    Object.entries(restConfig).map(([key, defaultAtom]) => {
      // const writableAtom = atom(
      //   (get) => {
      //     const thisKey = key as EntangledAtomKey;
      //     const thisDefaultAtom = defaultAtom as Atom<T[EntangledAtomKey]>;
      //     const realm = get(realmAtom);
      //     const realmOverrides: Partial<{ [K in EntangledAtomKey]: Atom<T[K]> }> =
      //       get(focusAtom(realmOverridesAtom, (o) => o.optional().prop(realm))) ?? {};
      //     const thisOverride = realmOverrides[thisKey];
      //     if (thisOverride) {
      //       return get(thisOverride);
      //     }
      //     const value = get(thisDefaultAtom);
      //     return value;
      //   },
      //   (get: Getter, set: Setter, props: any[]) => {
      //     const thisKey = key as EntangledAtomKey;
      //     const thisDefaultAtom = defaultAtom as Atom<T[EntangledAtomKey]>;
      //     const realm = get(realmAtom);
      //     const realmOverrides: Partial<{ [K in EntangledAtomKey]: Atom<T[K]> }> =
      //       get(focusAtom(realmOverridesAtom, (o) => o.optional().prop(realm))) ?? {};
      //     const thisOverride = realmOverrides[thisKey];
      //     if (thisOverride) {
      //       set(thisOverride, props);
      //       return;
      //     }
      //     set(thisDefaultAtom, props);
      //   },
      // );
      // const effectAtom = atomEffect((get, set) => {
      //   const source = get(sourceAtom);
      //   if (source) {
      //     console.log("entanglement sub effect", key);
      //     const listener = (event: MessageEvent) => {
      //       console.log("entanglement sub effect update", key, event.data);
      //       const [eKey, value] = event.data;
      //       // if (eKey === key) {
      //       //   set(defaultAtom, value);
      //       // }
      //     };
      //     source.addEventListener(key, listener);
      //     source.addEventListener("message", (event) => {
      //       console.log(`[broadcast -> ${getRealm()}`, event.data);
      //     });
      //     return () => {
      //       source.removeEventListener(key, listener);
      //     };
      //   }
      // });
      const compoundAtom = atom(
        (get) => {
          const value = get(defaultAtom);
          return value;
        },
        (get, set, update: any) => {
          set(defaultAtom, update);
        },
      );
      return [key, compoundAtom];
    }),
  ) as typeof restConfig;

  function bindToRealm<T>(config: T & { [REALM]: Realm }) {
    const { [REALM]: realm, ...restConfig } = config;
    const lens = focusAtom(realmOverridesAtom, (o) => o.optional().prop(realm));
    store.set(lens, (prev = {}) => ({
      ...prev,
      ...restConfig,
    }));

    return entangledAtoms;
  }
  function isEntangledAtomKey(key: unknown): key is EntangledAtomKey {
    return typeof key === "string" && key in entangledAtoms;
  }

  const createMessageHandler = (store: INTERNAL_PrdStore) => {
    return (event: MessageEvent) => {
      Object.entries(event.data).forEach(async ([key, value]) => {
        if (isEntangledAtomKey(key)) {
          const atom = entangledAtoms[key];
          if (!atom) return;
          const thisValue = await store.get(atom as any);
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
    handle.onerror = (event) => {};
    // handle.onmessage = createMessageHandler(store);
    return () => {
      handle.terminate();
    };
  }, []);

  return ref.current?.postMessage;
};
