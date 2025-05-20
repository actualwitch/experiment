import { useEffect } from "react";

export const useHandlers = (handlers: Record<string, (e: KeyboardEvent) => void>) => {
  const keys = Object.keys(handlers);
  const handler = (e: KeyboardEvent) => {
    if (keys.includes(e.key)) {
      handlers[e.key](e);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
};
