import { atom, useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function portalIO() {
  const elementAtom = atom<null | HTMLElement>(null);

  function Input({ children }: { children: ReactNode }) {
    const element = useAtomValue(elementAtom);

    return element ? createPortal(children, element) : null;
  }

  function Output() {
    const setElement = useSetAtom(elementAtom);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      setElement(ref.current);
    }, [ref.current]);
    useEffect(
      () => () => {
        setElement(null);
      },
      [],
    );
    return <div ref={ref} />;
  }

  return [Input, Output] as const;
}
