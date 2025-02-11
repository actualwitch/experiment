import { useState, useEffect, useRef, useCallback } from "react";
import type { TransitionState } from ".";

export function useItemTransition<T = { [key: string]: unknown }, I = null | T | boolean>(
  item: I,
  { timeout } = { timeout: 0 },
) {
  const ref = useRef<I | undefined>(typeof item !== "boolean" && item !== null ? item : undefined);
  useEffect(() => {
    ref.current = typeof item === "boolean" ? undefined : item === null ? undefined : item;
  }, [item]);

  const [isActive, setIsActive] = useState(Boolean(item));
  const [transitionState, setTransitionState] = useState<TransitionState>(item ? "entered" : "exited");

  useEffect(() => {
    if (!timeout) return;
    if (transitionState === "entering" || transitionState === "exiting") {
      const id = setTimeout(() => {
        setTransitionState(`${transitionState.substring(0, transitionState.length - 3) as "enter" | "exit"}ed`);
      }, timeout);
      return () => clearTimeout(id);
    }
  }, [transitionState, timeout]);

  const nextState = useCallback(() => {
    switch (transitionState) {
      case "entering": {
        setTransitionState(item ? "entered" : "exiting");
        break;
      }
      case "exiting": {
        setTransitionState(item ? "entered" : "exited");
        break;
      }
    }
  }, [transitionState, item]);

  useEffect(() => {
    if (item) {
      if (isActive) {
        if (transitionState === "entered") return;
        const timerId = setTimeout(() => {
          setTransitionState("entering");
        }, 20);
        return () => clearTimeout(timerId);
      } else {
        setIsActive(true);
        setTransitionState("exited");
      }
    }
    if (!item) {
      if (transitionState === "exited") {
        setIsActive(false);
      } else {
        setTransitionState("exiting");
      }
    }
  }, [item, transitionState, isActive]);

  return { transitionState, shouldRender: isActive, props: ref.current, nextState };
}
