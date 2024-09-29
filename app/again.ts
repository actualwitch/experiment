import { atomEffect } from "jotai-effect";
import { json, useLoaderData } from "@remix-run/react";
import { useHydrateAtoms } from "jotai/utils";
import { Atom, atom, useAtom } from "jotai";
import { store } from "./state/common";
import { sendKeyValAtom } from "./routes/portal";
import { useEffect, useState } from "react";

export const ticketMistress = atom<Map<string, Atom<unknown>>>(new Map());

const sourceAtom = atom<EventSource | null>(null);

export function entangledResponse(atoms: object) {
  const values: any = {};
  for (const [key, atom] of Object.entries(atoms)) {
    const value = store.get(atom);
    store.set(sendKeyValAtom, [key, value]);
    values[key] = value;
  }
  return json(values);
}

export function createEntanglement<T extends object, L extends any>(atoms: T) {
  const atomKeys = Object.keys(atoms).filter((key) => (atoms[key] as any).hasOwnProperty("write"));
  const entanglementAtom = atomEffect((get, set) => {
    const source = get(sourceAtom);
    if (source === null) {
      console.error("entanglement inactive");
      return;
    }
    console.log("entanglement active");

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
    // useEffect(() => {
    //   try {
    //     console.log("useEntangledAtoms", loaderData);
    //     for (const [key, value] of Object.entries(atoms)) {
    //       if (loaderData[key] !== undefined) {
    //         store.set(value, loaderData[key]);
    //       }
    //     }
    //   } catch (e) {
    //     console.error("entanglement failed", e);
    //   }
    // }, [loaderData]);
    useHydrateAtoms(atomKeys.map((key) => [atoms[key], loaderData[key]]));
    // useAtom(entanglementAtom);
  }

  let retries = 0;

  return {
    useEntangledAtoms,
    entanglementAtom,
    useSourceMachine: () => {
      const [state, setState] = useState<"idle" | "nominal" | "error">("idle");
      const [source, setSource] = useAtom(sourceAtom);
      useEffect(() => {
        if (state === "error") {
          source?.close();
          setSource(null);
          const id = setTimeout(() => {
            if (retries < 5) {
              setState("idle");
              retries++;
            }
          }, Math.random() * 1000);
          return () => clearTimeout(id);
        }
        if (state === "idle") {
          if (source) source?.close();
          const newSource = new EventSource("/portal");
          newSource.onerror = (event) => {
            console.error(event);
          };
          setState("nominal");
          setSource(newSource);
          return;
        }
        if (state === "nominal") {
          const handler = (event: BeforeUnloadEvent) => {
            console.log("closing source");
            source?.close();
          };

          window.addEventListener("beforeunload", handler);

          return () => {
            window.removeEventListener("beforeunload", handler);
          };
        }
      }, [state, source]);
    },
  };
}
