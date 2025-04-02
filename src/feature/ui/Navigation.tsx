import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import path from "node:path";
import { NavLink, useLocation } from "react-router";
import { Maybe } from "true-myth";

import { templatesAtom, selectionAtom } from "../../atoms/common";
import { experimentAtom } from "../../atoms/experiment";
import { name, TRIANGLE } from "../../const";
import { REVISION } from "../../const/dynamic";
import { bs, sidebarWidth } from "../../style";
import { nonInteractive, widthAvailable } from "../../style/mixins";
import { increaseSpecificity } from "../../style/utils";
import { filesInDir } from "../../utils/context";
import { entangledAtom } from "../../utils/entanglement";
import { portalIO } from "../../utils/portal";
import { getRealm } from "../../utils/realm";
import { ROUTES, experimentsSidebarAtom } from "../router";
import { View } from "./view";
import { isMetaExperimentAtom } from "../../atoms/store";
import { css } from "@emotion/react";

export const [SidebarInput, SidebarOutput] = portalIO();

const NavigationContainer = styled.nav<{ shouldHideOnMobile?: boolean }>`
  padding: ${bs()};
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 0 ${sidebarWidth};
  ul {
    list-style: none;
    padding: 0;
  }
  li::marker {
    content: none;
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
  & > header {
    span {
      width: 42px;
      display: inline-grid;
      place-items: center;
      margin-right: 6px;
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

const H2 = styled.h2<{ subContent?: string }>`
  user-select: none;
  ${(p) =>
    p.subContent &&
    css`
      a::after {
        content: "${p.subContent}";
        font-variant: super;
        color: currentColor;
        padding-left: 1px;
      }
    `}
`;

const routesAtom = atom((get) => {
  const isMetaExperiment = get(isMetaExperimentAtom);
  return ROUTES.filter((route) => (route.experimental ? isMetaExperiment : true));
});

const Header = styled.h3`
  user-select: none;
`;

export const selectedContextPath = atom(
  (get) => {
    const selection = get(selectionAtom);
    const experiment = get(experimentAtom);
    return Maybe.of(selection[0])
      .map((idx) => experiment[idx])
      .map((msg) => msg.content?.directory)
      .unwrapOr(null);
  },
  (get, set, value: string) => {
    const selection = get(selectionAtom);
    const experiment = get(experimentAtom);
    const selectedIdx = selection[0];
    if (selectedIdx !== undefined) {
      const selectedMessage = experiment[selectedIdx];
      if (selectedMessage.role === "context") {
        selectedMessage.content = { directory: value };

        set(experimentAtom, [...experiment]);
      }
    }
  },
);

export const selectedContextContent = entangledAtom(
  "selected-ctx",
  atom(async (get) => {
    if (getRealm() !== "server") return;
    try {
      const currentDir = get(selectedContextPath);
      if (currentDir) {
        try {
          const files = await filesInDir(currentDir);
          const entry = path.parse(currentDir);
          return { [entry.name]: Object.fromEntries(files.map((file) => [file.name, {}])) };
        } catch (e) {
          console.log(e);
        }
      }
      return null;
    } catch (e) {
      console.log(e);
    }
  }),
);

export const goToAtom = entangledAtom(
  "gotodir",
  atom(null, async (get, set, dir: string) => {
    if (getRealm() !== "server") return;
    const currentDir = get(selectedContextPath);
    if (!currentDir) return;
    set(selectedContextPath, path.join(currentDir, dir));
  }),
);

const SidebarComponent = () => {
  const [data] = useAtom(experimentsSidebarAtom);
  const [selectedContext] = useAtom(selectedContextContent);
  const [_, goToDir] = useAtom(goToAtom);
  if (selectedContext) {
    return (
      <View
        disableSorting
        onTitleClick={(value, key, path) => {
          if (path.length < 2) {
            goToDir("..");
            return;
          }
          goToDir(path[path.length - 1]);
        }}
      >
        {selectedContext}
      </View>
    );
  }
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
  return (
    <NavigationContainer>
      <header>
        {routes.map(
          ({ icon, title, path, showInSidebar }) =>
            showInSidebar && (
              <H2 key={path}>
                <span>{icon}</span>
                <NavLink to={path}>
                  {title}
                  {false && title === name ? <sup style={{ textDecoration: "none" }}>σ</sup> : undefined}
                </NavLink>
              </H2>
            ),
        )}
      </header>
      <GrowBox>
        <SidebarOutput />
        {(location.pathname === "/" || location.pathname.startsWith("/experiment")) && <SidebarComponent />}
      </GrowBox>
      <Footer>
        © ∞ {TRIANGLE} {REVISION}
      </Footer>
    </NavigationContainer>
  );
};
