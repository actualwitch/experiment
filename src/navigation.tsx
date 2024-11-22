import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";
import { VERSION } from "./const";
import { bs } from "./style";
import { nonInteractive, widthAwailable } from "./style/mixins";
import { portalIO } from "./utils/portal";
import { ROUTES } from "./pages/_router";

export const [SidebarInput, SidebarOutput] = portalIO();

const Navigation = styled.nav`
  padding: ${bs()};
  display: flex;
  flex-direction: column;
  ul {
    list-style: none;
    padding: 0;
  }
  input {
    ${widthAwailable}
  }
`;

const GrowBox = styled.div`
  flex-grow: 1;
`;

const Footer = styled.footer`
  text-align: center;
  opacity: 0.25;
  ${nonInteractive}
`;

export const NavigationSidebar = () => {
  return (
    <Navigation>
      <header>
        {ROUTES.map(({ icon, title, path, showInSidebar }) => showInSidebar && (
          <h2 key={path}>
            {icon} <NavLink to={path}>{title}</NavLink>
          </h2>
        ))}
      </header>
      <GrowBox>
        <SidebarOutput />
      </GrowBox>
      <Footer>© ∞ ▴ {VERSION}</Footer>
    </Navigation>
  );
};
