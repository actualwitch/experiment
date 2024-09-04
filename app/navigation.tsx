import { NavLink, useMatches } from "@remix-run/react";
import { useEffect, useState } from "react";

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
      <NavContent />
    </nav>
  );
};
