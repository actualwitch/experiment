import type { MouseEvent } from "react";

export const cancelEvent = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
