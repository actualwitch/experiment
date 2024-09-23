import styled from "@emotion/styled";
import { NavLink } from "@remix-run/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { bs } from "./style";
import { atom, useAtom } from "jotai";
import { store } from "./state/common";
import { createPortal } from "react-dom";

const elementId = "sidebar";

function portalIO() {
  const elementAtom = atom<null | HTMLElement>(null);

  function Input({ children }: { children: ReactNode }) {
    const [element, setElement] = useAtom(elementAtom);

    return element ? createPortal(children, element) : null;
  }

  function Output() {
    const [element, setElement] = useAtom(elementAtom);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      setElement(ref.current);
    }, [ref.current]);
    return <div ref={ref} />;
  }

  return [Input, Output] as const;
}

export const [SidebarInput, SidebarOutput] = portalIO();

const Navigation = styled.nav`
  padding: ${bs()};
`;

export const NavigationSidebar = () => {
  return (
    <Navigation>
      <h2>
        🔬 <NavLink to="/">Experiment</NavLink>
      </h2>
      <h2>
        ⛴️ <NavLink to="/import">Import</NavLink>
      </h2>
      <h2>
        📝 <NavLink to="/dataset">Dataset</NavLink>
      </h2>
      <h2>
        🔧 <NavLink to="/configure">Parameters</NavLink>
      </h2>
      <SidebarOutput />
    </Navigation>
  );
};
