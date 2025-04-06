import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { focusAtom } from "jotai-optics";

import { entangledAtom } from "../utils/entanglement";
import { getRealm } from "../utils/realm";
import { storeAtom } from "./store";

export type LayoutType = "mobile" | "desktop";
export const layoutAtom = atom<LayoutType>();
export const mobileQuery = "(max-width: 920px)";
export const desktopQuery = "(min-width: 921px)";

export const tracingAtom = (a: any) =>
  atom(
    (get) => {
      const value = get(a);
      console.log("getting ", JSON.stringify(value));
      return value;
    },
    (get, set, ...value) => {
      console.log("setting ", JSON.stringify(value));
      set(a, ...value);
    },
  );

export type Path = [number] | [number, "content"];
export const selectionAtom = entangledAtom("selection", atom<Path | []>([]));

export const layoutTrackerAtom = atomEffect((get, set) => {
  const mql = window.matchMedia(mobileQuery);
  const listener = (mql: MediaQueryList | MediaQueryListEvent) => {
    set(layoutAtom, mql.matches ? "mobile" : "desktop");
  };
  listener(mql);
  mql.addEventListener("change", listener);
  return () => {
    mql.removeEventListener("change", listener);
  };
});
export type WithLayout = { layout?: "mobile" | "desktop" };

export const _isActionPanelOpenAtom = atom(false);
export const _isNavPanelOpenAtom = atom(false);

export const isAnyPanelOpenAtom = atom((get) => get(_isNavPanelOpenAtom) || get(_isActionPanelOpenAtom));

export const isActionPanelOpenAtom = atom(
  (get) => get(_isActionPanelOpenAtom),
  (get, set, value: boolean) => {
    if (value && get(_isNavPanelOpenAtom)) {
      set(_isNavPanelOpenAtom, false);
      return;
    }
    set(_isActionPanelOpenAtom, value);
  },
);
export const isNavPanelOpenAtom = atom(
  (get) => get(_isNavPanelOpenAtom),
  (get, set, value: boolean) => {
    if (value && get(_isActionPanelOpenAtom)) set(_isActionPanelOpenAtom, false);
    set(_isNavPanelOpenAtom, value);
  },
);

export const templatesAtom = entangledAtom(
  "templates",
  focusAtom(storeAtom, (o) => o.prop("templates")),
);

export const experimentLayoutAtom = entangledAtom(
  "experimentLayout",
  focusAtom(storeAtom, (o) => o.prop("experimentLayout")),
);

export const parentAtom = entangledAtom("parent", atom<string | undefined>(undefined));

export const debugAtom = entangledAtom(
  "debug",
  atom(() => {
    if (getRealm() !== "server") return false;
    return process.env.DEBUG === "true";
  }),
);

export const nopeAtom = atom((get) => null);
