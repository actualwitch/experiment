import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { log } from "../utils/logger";
import { publish } from "../utils/æther";
import { divergentAtom } from "../utils/entanglement";
import { getRealm, hasBackend } from "../utils/realm";

export const isFocusedAtom = atom(false);
export const trackVisibleAtom = atomEffect((get, set) => {
  const listener = () => {
    log("visibility change", document.visibilityState);
    set(isFocusedAtom, document.visibilityState === "visible");
  };
  listener();
  document.addEventListener("visibilitychange", listener);
  return () => {
    document.removeEventListener("visibilitychange", listener);
  };
});
export const subscriptionAtom = divergentAtom(
  () => {
    if (!hasBackend()) {
      return undefined;
    }
    return atomEffect((get, set) => {
      const isVisible = get(isFocusedAtom);
      if (!isVisible) {
        return;
      }
      const source = new EventSource("/");
      source.addEventListener("message", (event) => {
        publish(JSON.parse(event.data));
      });
      return () => {
        source.close();
      };
    });
  },
  () => {
    return atom();
  },
);
