import styled from "@emotion/styled";
import { NavLink } from "react-router";
import { TRIANGLE, VERSION } from "./const";
import { ROUTES } from "./pages/_router";
import { bs } from "./style";
import { nonInteractive, widthAvailable } from "./style/mixins";
import { portalIO } from "./utils/portal";
import { atom, useAtom } from "jotai";
import { templatesAtom } from "./state/common";

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
    ${widthAvailable}
  }
  a {
    text-decoration: none;
    &[aria-current="page"] {
      text-decoration: underline;
    }
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

const H2 = styled.h2`
  user-select: none;
`;

const routesAtom = atom((get) => {
  const templates = get(templatesAtom);
  if (Object.keys(templates ?? {}).length === 0) {
    return ROUTES.filter((route) => route.title !== "Templates");
  }
  return ROUTES;
});

export const NavigationSidebar = () => {
  const [routes] = useAtom(routesAtom);
  return (
    <Navigation>
      <header>
        {routes.map(
          ({ icon, title, path, showInSidebar }) =>
            showInSidebar && (
              <H2 key={path}>
                {icon} <NavLink to={path}>{title}</NavLink>
              </H2>
            ),
        )}
      </header>
      <GrowBox>
        <SidebarOutput />
      </GrowBox>
      <Footer>
        © ∞ {TRIANGLE} {VERSION}
      </Footer>
    </Navigation>
  );
};
