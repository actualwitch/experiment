import { atom } from "jotai";
import { atomEffect } from "jotai-effect";

export const prefersLightQuery = "(prefers-color-scheme: light)";
export const prefersDarkQuery = "(prefers-color-scheme: dark)";

export const systemThemeAtom = atom<undefined | "dark" | "light">();

export const trackSystemEffect = atomEffect((get, set) => {
  const mql = window.matchMedia(prefersDarkQuery);
  const listener = (mql: MediaQueryList | MediaQueryListEvent) => {
    set(systemThemeAtom, mql.matches ? "dark" : "light");
  };
  listener(mql);
  mql.addEventListener("change", listener);
  return () => {
    mql.removeEventListener("change", listener);
  };
});
