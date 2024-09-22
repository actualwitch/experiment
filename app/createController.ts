import { useLoaderData, useSubmit } from "@remix-run/react";
import { Atom, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { DEBUG } from "./const";
import { useMemo } from "react";

export function createController<Key extends string, T extends Record<Key, Atom<unknown>>, Loader>(
  atoms: T,
  action?: string,
): () => Record<Key, [value: any, (value: any) => void]> {
  return () => {
    const submit = useSubmit();
    const serverAtoms = useLoaderData<Loader>();
    const hydration = useMemo(() => {
      return Object.entries(serverAtoms || {}).map(([key, value]: any) => [atoms[key as keyof T], value]) as any;
    }, []);
    useHydrateAtoms(hydration);
    const hooks: any = {};
    for (const [key, atom] of Object.entries(atoms) as [Key, Atom<any>][]) {
      const [get, set] = useAtom(atom);
      hooks[key] = [
        get,
        (...value: any) => {
          if (DEBUG) {
            console.log("client>submit", { [key]: value });
          }
          submit({ [key]: value }, { action, method: "POST", navigate: false, encType: "application/json" });
        },
      ];
    }
    return hooks;
  };
}
