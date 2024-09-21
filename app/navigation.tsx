import styled from "@emotion/styled";
import { NavLink } from "@remix-run/react";
import { useEffect, useState } from "react";
import { bs } from "./style";

const elementId = "sidebar";

export function useSidebar() {
  const [sidebar, setSidebar] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSidebar(document.getElementById(elementId));
  }, []);

  return sidebar;
}

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
        🔧 <NavLink to="/configure">Parameters</NavLink>
      </h2>
      <div id={elementId} />
    </Navigation>
  );
};
