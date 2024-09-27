import { atomEffect } from "jotai-effect";
import { json, useLoaderData } from "@remix-run/react";
import { useHydrateAtoms } from "jotai/utils";
import { atom, useAtom } from "jotai";
import { store } from "./state/common";

export const sourceAtom = atom<EventSource | null>(null);
export const sourceEffectAtom = atomEffect((get, set) => {
  const source = new EventSource("/portal");
  source.onerror = (event) => {
    console.error(event);
  };
  set(sourceAtom, source);
  return () => {
    source.close();
  };
});

export const entanglement = new BroadcastChannel("entanglement");

export function entangledResponse(atoms: object) {
  const out = {};
  for (const [key, atom] of Object.entries(atoms)) {
    const value = store.get(atom);
    out[key] = value;
    entanglement.dispatchEvent(new MessageEvent("message", { data: [key, value] }));
  }
  return json(out);
}

export function createEntanglement<T extends object, L extends any>(atoms: T) {
  const entanglementAtom = atomEffect((get, set) => {
    const source = get(sourceAtom);
    if (source === null) {
      console.error("entanglement inactive");
      return;
    }

    const unsub = Object.entries(atoms).map(([key, atom]) => {
      const listener = (event: MessageEvent) => {
        set(atom as any, JSON.parse(event.data));
      };
      source.addEventListener(key, listener);
      return () => {
        source.removeEventListener(key, listener);
      };
    });
    return () => {
      unsub.forEach((fn) => fn());
    };
  });
  function useEntangledAtoms() {
    const loaderData = useLoaderData<L>();
    useHydrateAtoms(Object.keys(atoms).map((key) => [atoms[key], loaderData[key]]));
    useAtom(entanglementAtom);
  }

  return useEntangledAtoms;
}
