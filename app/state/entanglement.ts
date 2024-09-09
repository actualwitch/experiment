import { useEffect, useRef } from "react";
import { createMessageHandler, store } from "./common";
import worker from "./entanglement.worker?worker";

export const useWorker = () => {
  const ref = useRef<Worker | null>(null);
  useEffect(() => {
    const handle = new worker();
    ref.current = handle;
    handle.onerror = (event) => {
      console.error(event);
    };
    handle.onmessage = createMessageHandler(store);
    return () => {
      handle.terminate();
    };
  }, []);

  return ref.current?.postMessage;
};
