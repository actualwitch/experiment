import { NavLink } from "@remix-run/react";
import { useEffect, useState } from "react";

const elementId = "sidebar";

export function useSidebar() {
  const [sidebar, setSidebar] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSidebar(document.getElementById(elementId));
  }, []);

  return sidebar;
}

export const NavigationSidebar = () => {
  return (
    <nav>
      <h2>
        🔬 <NavLink to="/">Experiment</NavLink>
      </h2>
      <h2>
        ⛴️ <NavLink to="/import">Import</NavLink>
      </h2>
      <h2>
        🔧 <NavLink to="/configure">Configure</NavLink>
      </h2>
      <div id={elementId} />
    </nav>
  );
};
