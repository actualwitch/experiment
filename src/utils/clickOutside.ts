import { useEffect, type RefObject } from "react";

export const useClickOutside = (ref: RefObject<HTMLElement | null>, fn: () => void) => {
  const listener = (e: MouseEvent | TouchEvent) => {
    if (ref.current && e.target && !ref.current.contains(e.target as Node)) {
      fn();
    }
  };

  useEffect(() => {
    document.addEventListener("click", listener, { passive: true });
    document.addEventListener("touchstart", listener, { passive: true });

    return () => {
      document.removeEventListener("click", listener);
      document.removeEventListener("touchstart", listener);
    };
  });
};
