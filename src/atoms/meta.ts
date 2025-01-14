import { atom } from "jotai";
import { description, name, TRIANGLE } from "../const";

export const titleAtom = atom(name);
export const titleOverrideAtom = atom<string | null>(null);
export const effectiveTitleAtom = atom((get) => get(titleOverrideAtom) ?? get(titleAtom));
export const pageTitleAtom = atom((get) => {
  const effectiveTitle = get(effectiveTitleAtom);
  const newTitle = effectiveTitle === "Experiment" ? effectiveTitle : `${effectiveTitle} ${TRIANGLE} Experiment`;
  return newTitle;
});
export const descriptionAtom = atom(description);
export const iconAtom = atom("🔬");
