import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import { NavLink, useLocation } from "react-router";

import { ROUTES, experimentsSidebarAtom } from "../router";
import { revisionAtom, templatesAtom } from "../../atoms/common";
import { TRIANGLE } from "../../const";
import { bs } from "../../style";
import { nonInteractive, widthAvailable } from "../../style/mixins";
import { increaseSpecificity } from "../../style/utils";
import { portalIO } from "../../utils/portal";

export const [SidebarInput, SidebarOutput] = portalIO();

const NavigationContainer = styled.nav<{ shouldHideOnMobile?: boolean }>`
  padding: ${bs()};
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
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
      text-underline-offset: 4px;
    }
  }
`;

const GrowBox = styled.div`
  flex-grow: 1;
  ${increaseSpecificity()} ul {
    padding-left: 0;
  }
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

const Header = styled.h3`
  user-select: none;
`;

const SidebarComponent = () => {
  const [data] = useAtom(experimentsSidebarAtom);
  if (!data.length) return null;
  return (
    <>
      <Header>History</Header>
      <ul>
        {data.map(({ link, name }) => (
          <li key={name}>
            <NavLink to={link}>{name}</NavLink>
          </li>
        ))}
      </ul>
    </>
  );
};

export const Navigation = () => {
  const [routes] = useAtom(routesAtom);
  const location = useLocation();
  const [revision] = useAtom(revisionAtom);
  return (
    <NavigationContainer>
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
        {(location.pathname === "/" || location.pathname.startsWith("/experiment")) && <SidebarComponent />}
      </GrowBox>
      <Footer>
        © ∞ {TRIANGLE} {revision}
      </Footer>
    </NavigationContainer>
  );
};
