import { type Atom, atom, useAtom } from "jotai";
import { useEffect, type JSX, type PropsWithChildren } from "react";
import { Route, Routes, useLocation } from "react-router";

import { experimentIdsAtom, isMetaExperimentAtom } from "../../atoms/store";
import type { Config } from "../ui/ConfigRenderer";
import { TRIANGLE, description, name } from "../../const";
import Experiment, { actionsAtom as experimentActionsAtom } from "./Experiment";
import Import, { actionsAtom as importActionsAtom } from "./Import";
import Explore from "./Explore";
import Calendar from "./Calendar";
import NewExperiment, { actionsAtom as newExperimentActionsAtom } from "./NewExperiment";
import Parameters from "./Parameters";
import Templates, { actionsAtom as templateActionsAtom } from "./Templates";
import { atomEffect } from "jotai-effect";

export type AppRoute = {
  icon: string;
  title: string;
  path: string;
  component: () => JSX.Element;
  showInSidebar?: boolean;
  sidebar?: { atom: Atom<{ counter: number; config: Config }>; title?: string };
  experimental?: boolean;
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
  {
    icon: "⛴️",
    title: "Import",
    showInSidebar: true,
    path: "/import",
    component: Import,
    sidebar: { atom: importActionsAtom, title: "Actions" },
  },
  {
    icon: "💿",
    title: "Templates",
    showInSidebar: true,
    path: "/templates",
    component: Templates,
    sidebar: { atom: templateActionsAtom, title: "Actions" },
  },
  {
    icon: "🌍",
    title: "Explore",
    showInSidebar: true,
    path: "/explore",
    component: Explore,
    experimental: true,
  },
  {
    icon: "📅",
    title: "Calendar",
    showInSidebar: true,
    path: "/calendar",
    component: Calendar,
    experimental: true,
  },
  { icon: "🛠️", title: "Parameters", showInSidebar: true, path: "/parameters", component: Parameters },
];

export const routeAtom = atom<AppRoute | null>(null);

function RouteSync({ thisRoute, children }: PropsWithChildren<{ thisRoute: AppRoute }>) {
  const location = useLocation();
  const [route, setRoute] = useAtom(routeAtom);
  useEffect(() => {
    if (!route || route.path !== location.pathname) {
      setRoute(thisRoute);
    }
  }, [route?.path, location]);
  return children;
}

export const routerRoutesAtom = atom((get) => {
  const isMetaExperiment = get(isMetaExperimentAtom);
  return ROUTES.filter((route) => {
    if (route.experimental) return isMetaExperiment;
    return true;
  }).map((route) => {
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
});

export const Router = () => {
  const [routerRoutes] = useAtom(routerRoutesAtom);
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

export const navigateAtom = atom<null | ((path: string) => void)>(null);
