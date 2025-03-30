import { useState, useEffect, useRef, useCallback, type RefObject } from "react";
import type { TransitionState } from ".";

export function useItemTransition<T = Record<string, unknown>, I = T | boolean | null>(
  item: I,
  elementRef: RefObject<HTMLElement | null>,
) {
  // 1) Keep the actual item props in a ref (if you still need them)
  const propsRef = useRef<I | undefined>(typeof item !== "boolean" && item !== null ? item : undefined);

  useEffect(() => {
    propsRef.current = typeof item === "boolean" ? undefined : item === null ? undefined : item;
  }, [item]);

  // 3) Manage the states: isActive controls whether we should render; transitionState tracks the phase
  const [isActive, setIsActive] = useState(Boolean(item));
  const [transitionState, setTransitionState] = useState<TransitionState>(item ? "entered" : "exited");

  // 4) This effect listens for the "transitionend" event on the attached DOM node
  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    function handleTransitionEnd(e: TransitionEvent) {
      // Limit to transitions on the exact element (not its children, for instance)
      if (e.target !== node) return;

      if (transitionState === "entering") {
        setTransitionState("entered");
      } else if (transitionState === "exiting") {
        setTransitionState("exited");
      }
    }

    node.addEventListener("transitionend", handleTransitionEnd);
    return () => {
      node.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [transitionState]);

  // 5) Optional convenience callback if you need to manually force next transition
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

  // 6) Track changes to "item" and update states accordingly
  useEffect(() => {
    if (item) {
      // item === truthy => we want to ensure it's active
      if (!isActive) {
        // on first mount (from "off" to "on"), show the element but keep it in "exited" until next frame
        setIsActive(true);
        setTransitionState("exited");
      } else {
        // if it's already active but not fully "entered," move to "entering"
        if (transitionState !== "entered") {
          // Use requestAnimationFrame or setTimeout(…, 0) to wait a tick
          const rafId = requestAnimationFrame(() => {
            setTransitionState("entering");
          });
          return () => cancelAnimationFrame(rafId);
        }
      }
    } else {
      // item === falsy => we want to hide it
      if (transitionState === "exited") {
        // if already "exited," fully remove the element
        setIsActive(false);
      } else if (transitionState !== "exiting") {
        setTransitionState("exiting");
      }
    }
  }, [item, transitionState, isActive]);

  return {
    transitionState,
    shouldRender: isActive,
    // The user can attach this ref to the element whose CSS transition we’re listening for:
    elementRef,
    // If you still want to expose the original item props:
    props: propsRef.current,
    // Optional callback if you need to manually trigger next
    nextState,
  };
}
