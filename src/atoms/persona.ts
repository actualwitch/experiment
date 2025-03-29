import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { entangledAtom } from "../utils/entanglement";
import { storeAtom } from "./store";

// Personas stored in the main Store
export const personasAtom = entangledAtom(
  "personas",
  focusAtom(storeAtom, (o) => o.prop("personas")),
);

export const activePersonaAtom = entangledAtom("active-persona", atom<string | null>(null));

export const currentPersonaContextAtom = atom((get) => {
  const personas = get(personasAtom);
  const activeId = get(activePersonaAtom);
  return activeId && personas ? personas[activeId] : null;
});
