import { atom } from "jotai";
import { description, title, TRIANGLE } from "../const";

export const titleAtom = atom(title);
export const pageTitleAtom = atom(get => {
  const title = get(titleAtom);
  const newTitle = title === "Experiment" ? title : `${title} ${TRIANGLE} Experiment`;
  return newTitle;
})
export const descriptionAtom = atom(description);
export const iconAtom = atom("🔬");
