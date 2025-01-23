import { Route, Routes, useLocation, useParams } from "react-router";
import Experiment, { actionsAtom as experimentActionsAtom } from "./Experiment";
import Import from "./Import";
import NewExperiment, { actionsAtom as newExperimentActionsAtom } from "./NewExperiment";
import Parameters from "./Parameters";
import Templates from "./Templates";
import { atom, useAtom, useSetAtom, type Atom } from "jotai";
import { useEffect, type JSX, type PropsWithChildren } from "react";
import { experimentIdsAtom } from "../../atoms/common";
import { description, TRIANGLE, name } from "../../const";
import type { Config } from "../../components/ConfigRenderer";

export type AppRoute = {
  icon: string;
  title: string;
  path: string;
  component: () => JSX.Element;
  showInSidebar?: boolean;
  sidebar?: { atom: Atom<{ counter: number; config: Config }>; title?: string };
};

export const experimentsSidebarAtom = atom((get) => {
  const experimentIds = get(experimentIdsAtom);
  return [...experimentIds]
    .map(([id, subId]) => ({
      name: `Experiment #${id}.${subId}`,
      link: `/experiment/${id}/${subId}`,
    }))
    .reverse();
});

export const ROUTES: AppRoute[] = [
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: true,
    path: "/",
    component: NewExperiment,
    sidebar: { atom: newExperimentActionsAtom, title: "Actions" },
  },
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: false,
    path: "/experiment/:id/:runId",
    component: Experiment,
    sidebar: { atom: experimentActionsAtom, title: "Actions" },
  },
  { icon: "⛴️", title: "Import", showInSidebar: true, path: "/import", component: Import },
  { icon: "💿", title: "Templates", showInSidebar: true, path: "/templates", component: Templates },
  { icon: "🛠️", title: "Parameters", showInSidebar: true, path: "/parameters", component: Parameters },
];

export const routeAtom = atom<(AppRoute & { params: Record<string, string | undefined> }) | null>(null);

function RouteSync({ thisRoute, children }: PropsWithChildren<{ thisRoute: AppRoute }>) {
  const location = useLocation();
  // const params = useParams();
  const [route, setRoute] = useAtom(routeAtom);
  if (!route || route.path !== location.pathname) {
    setRoute(thisRoute);
  }
  return children;
}

const routerRoutes = ROUTES.map((route) => {
  const Component = route.component;
  return {
    ...route,
    element: (
      <RouteSync thisRoute={route}>
        <Component />
      </RouteSync>
    ),
  };
});

export const Router = () => {
  return (
    <Routes>
      {routerRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  );
};

export const titleAtom = atom(name);
export const titleOverrideAtom = atom<string | null>(null);
export const effectiveTitleAtom = atom((get) => get(titleOverrideAtom) ?? get(routeAtom)?.title ?? name);
export const pageTitleAtom = atom((get) => {
  const effectiveTitle = get(effectiveTitleAtom);
  const newTitle = effectiveTitle.includes(name) ? effectiveTitle : `${effectiveTitle} ${TRIANGLE} Experiment`;
  return newTitle;
});
export const descriptionAtom = atom(description);
export const iconAtom = atom((get) => {
  const route = get(routeAtom);
  return route?.icon ?? "🔬";
});
