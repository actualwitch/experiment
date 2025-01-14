import { Route, Routes, useMatch } from "react-router";
import Experiment from "./Experiment";
import Import from "./Import";
import NewExperiment from "./NewExperiment";
import Parameters from "./Parameters";
import Templates from "./Templates";
import { atom, useSetAtom, type Atom } from "jotai";
import { iconAtom, titleAtom } from "../../atoms/meta";
import { useEffect, type PropsWithChildren } from "react";
import { experimentIdsAtom } from "../../atoms/common";

type RouteList = Array<{
  icon: string;
  title: string;
  path: string;
  component: () => JSX.Element;
  showInSidebar?: boolean;
  sidebar?: { atom: Atom<Array<{ name: string; link: string }>>; title?: string };
}>;

export const experimentsSidebarAtom = atom((get) => {
  const experimentIds = get(experimentIdsAtom);
  return [...experimentIds]
    .map(([id, subId]) => ({
      name: `Experiment #${id}.${subId}`,
      link: `/experiment/${id}/${subId}`,
    }))
    .reverse();
});

export const ROUTES: RouteList = [
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: true,
    path: "/",
    component: NewExperiment,
  },
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: false,
    path: "/experiment/:id/:runId",
    component: Experiment,
  },
  { icon: "⛴️", title: "Import", showInSidebar: true, path: "/import", component: Import },
  { icon: "💿", title: "Templates", showInSidebar: true, path: "/templates", component: Templates },
  { icon: "🛠️", title: "Parameters", showInSidebar: true, path: "/parameters", component: Parameters },
];

function IconAndTitleUpdater({ icon, title, children }: PropsWithChildren<{ icon: string; title: string }>) {
  const setTitle = useSetAtom(titleAtom);
  const setIcon = useSetAtom(iconAtom);
  useEffect(() => {
    setTitle(title);
    setIcon(icon);
  }, [title, icon]);
  return children;
}

const routerRoutes = ROUTES.map(({ component: Component, ...rest }) => ({
  ...rest,
  element: (
    <IconAndTitleUpdater title={rest.title} icon={rest.icon}>
      <Component />
    </IconAndTitleUpdater>
  ),
}));

export const Router = () => {
  return (
    <Routes>
      {routerRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  );
};
