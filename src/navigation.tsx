import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { bs } from "./style";
import { NavLink } from "react-router-dom";
import { VERSION } from "./const";

function portalIO() {
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

export const [SidebarInput, SidebarOutput] = portalIO();

const Navigation = styled.nav`
  padding: ${bs()};
`;

export const NavigationSidebar = () => {
  return (
    <Navigation>
      <header>
        <h2>
          🔬 <NavLink to="/">Experiment</NavLink>
        </h2>
        <h2>
          ⛴️ <NavLink to="/import">Import</NavLink>
        </h2>
        <h2>
          📝 <NavLink to="/templates">Templates</NavLink>
        </h2>
        <h2>
          🔧 <NavLink to="/parameters">Parameters</NavLink>
        </h2>
      </header>
      <SidebarOutput />
      <footer>{VERSION}</footer>
    </Navigation>
  );
};
