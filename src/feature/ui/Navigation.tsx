import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import path from "node:path";
import { NavLink, useLocation, useNavigate } from "react-router";

import { selectionAtom } from "../../atoms/common";
import { experimentAtom, experimentsAtom } from "../../atoms/experiment";
import { isDarkModeAtom, terminologyAtom } from "../../atoms/store";
import { TRIANGLE, name } from "../../const";
import { REVISION } from "../../const/dynamic";
import { mapTerminology } from "../../const/terminology";
import { bs, sidebarWidth } from "../../style";
import { nonInteractive, widthAvailable } from "../../style/mixins";
import { increaseSpecificity } from "../../style/utils";
import { filesInDir } from "../../utils/context";
import { entangledAtom } from "../../utils/entanglement";
import { portalIO } from "../../utils/portal";
import { getRealm } from "../../utils/realm";
import { routesAtom } from "../router";
import { View } from "./view";

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
  white-space: nowrap;
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

export const selectedContextPath = atom(
  (get) => {
    const selection = get(selectionAtom);
    const experiment = get(experimentAtom);
    const index = selection[0];
    const message = typeof index === "number" ? experiment[index] : null;
    const context = message ? message.content?.directory : null;
    return context || null;
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
        const files = await filesInDir(currentDir);
        const entry = path.parse(currentDir);
        return { [entry.name]: Object.fromEntries(files.map((file) => [file, {}])) };
      }
      return null;
    } catch (e) {
      console.error(e);
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

export const subjectAtom = atom((get) => {
  const terminology = get(terminologyAtom);
  const subject = terminology === "magical" ? mapTerminology(name) : name;
  return subject;
});

export const experimentsTreeAtom = entangledAtom(
  "experiment-tree",
  atom((get) => {
    const experiments = get(experimentsAtom) ?? {};
    const tree = Object.keys(experiments).reduce(
      (acc, item) => {
        const series = experiments[item as keyof typeof experiments];

        const entries = [...Object.entries(series)];
        entries.reverse();
        acc.push(entries.map(([subId]) => `${item}${TRIANGLE}${subId}`));
        return acc;
      },
      [] as Array<string[]>,
    );
    tree.reverse();
    return tree;
  }),
);

const SidebarComponent = () => {
  const [data] = useAtom(experimentsTreeAtom);
  const [selectedContext] = useAtom(selectedContextContent);
  const [_, goToDir] = useAtom(goToAtom);
  const [subject] = useAtom(subjectAtom);
  const navigate = useNavigate();
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
  const tree = data.reduce((acc, item, idx) => {
    const [pre, post] = item[0].split(TRIANGLE);

    acc[`${subject} #${pre}`] = item.reduce((acc, item) => {
      const [pre, post] = item.split(TRIANGLE);
      acc[`Variant ${post}`] = {};
      return acc;
    }, {});

    return acc;
  }, {});
  return (
    <View
      disableSorting
      onTitleClick={(_, __, path) => {
        const [id] = path;
        const segments = path.length === 1 ? [id, Object.keys(tree[id])[0]] : path.length === 2 ? path : null;
        if (segments) {
          const cursor = segments
            .map((segment, idx) => {
              const [pre, post] = segment.split(idx === 0 ? "#" : " ");
              return post;
            })
            .join("/");
          const link = `/experiment/${cursor}`;
          navigate(link);
        }
      }}
    >
      {data.reduce((acc, item, idx) => {
        const [pre, post] = item[0].split(TRIANGLE);

        acc[`${subject} #${pre}`] =
          item.length < 2
            ? {}
            : item.reduce((acc, item) => {
                const [pre, post] = item.split(TRIANGLE);
                acc[`Variant ${post}`] = {};
                return acc;
              }, {});

        return acc;
      }, {})}
    </View>
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
      <Footer>{REVISION}</Footer>
    </NavigationContainer>
  );
};
