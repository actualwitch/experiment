import styled from "@emotion/styled";
import { NavLink, useLocation, useMatches } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { Debugger } from "./dbg";
import { bs, content, h4 } from "./style";
import { css } from "@emotion/react";

const NavContent = () => {
  const matches = useMatches();
  const id = matches[1]?.id;
  const [content, setContent] = useState<React.ReactNode | null>(null);
  useEffect(() => {
    (async () => {
      if (!["routes/import"].includes(id)) {
        setContent(null);
        return;
      }
      const { Sidebar } = await import(`./${id}`);
      setContent(<Sidebar />);
    })();
  }, [id]);
  return content;
};

const NavSidebar = styled.nav`
  display: grid;
  grid-template-columns: 1fr;
`;

export const NavigationSidebar = () => {
  return (
    <NavSidebar>
      <h2>
        🔬 <NavLink to="/">Experiment</NavLink>
      </h2>
      <h2>
        ⛴️ <NavLink to="/import">Import</NavLink>
      </h2>
      <h2>
        🔧 <NavLink to="/configure">Configure</NavLink>
      </h2>
      <NavContent />
    </NavSidebar>
  );
};
