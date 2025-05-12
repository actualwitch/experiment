import { type Atom, atom, useAtom } from "jotai";
import { type JSX, type PropsWithChildren, useEffect } from "react";
import { Route, Routes, useLocation, useParams } from "react-router";

import { isMetaExperimentAtom, terminologyAtom } from "../../atoms/store";
import { TRIANGLE, description, name } from "../../const";
import { Actions } from "../ui/Actions";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
import Calendar from "./Calendar";
import Experiment, { actionsAtom as experimentActionsAtom } from "./Experiment";
import Explore from "./Explore";
import Import, { actionsAtom as importActionsAtom } from "./Import";
import NewExperiment, { actionsAtom as newExperimentActionsAtom } from "./NewExperiment/NewExperiment";
import Parameters from "./Parameters";
import Templates, { actionsAtom as templateActionsAtom } from "./Templates";
import { mapTerminology } from "../../const/terminology";
import { DesktopOnly } from "../ui/Mobile";

export type AppRoute = {
  icon: string;
  title: string;
  path: string;
  component: () => JSX.Element;
  showInSidebar?: boolean;
  actions?: Atom<{ counter: number; config: Config }>;
  experimental?: boolean;
};

export const ROUTES: AppRoute[] = [
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: true,
    path: "/",
    component: NewExperiment,
    actions: newExperimentActionsAtom,
  },
  {
    icon: "🔬",
    title: "Experiment",
    showInSidebar: false,
    path: "/experiment/:id/:runId",
    component: Experiment,
    actions: experimentActionsAtom,
  },
  {
    icon: "⛴️",
    title: "Import",
    showInSidebar: true,
    path: "/import",
    component: Import,
    actions: importActionsAtom,
  },
  {
    icon: "💿",
    title: "Templates",
    showInSidebar: true,
    path: "/templates",
    component: Templates,
    actions: templateActionsAtom,
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
export const paramsAtom = atom<Record<string, string | undefined>>({});

function RouteSync({ thisRoute, children }: PropsWithChildren<{ thisRoute: AppRoute }>) {
  const location = useLocation();
  const params = useParams();
  const [route, setRoute] = useAtom(routeAtom);
  const [_, setParams] = useAtom(paramsAtom);
  useEffect(() => {
    if (!route || route.path !== location.pathname) {
      setRoute(thisRoute);
      setParams(params);
    }
  }, [route?.path, location]);
  return children;
}

export const routesAtom = atom((get) => {
  const isMetaExperiment = get(isMetaExperimentAtom);
  const terminology = get(terminologyAtom);
  return ROUTES.reduce<Array<AppRoute & { element: JSX.Element }>>((acc, route) => {
    if (!route.experimental || isMetaExperiment) {
      const thisRoute = {
        ...route,
      };
      if (terminology === "magical") {
        thisRoute.icon = mapTerminology(thisRoute.icon);
        thisRoute.title = mapTerminology(thisRoute.title);
      }
      const Component = thisRoute.component;
      acc.push({
        ...thisRoute,
        element: (
          <RouteSync thisRoute={thisRoute}>
            <Component />
            {thisRoute.actions ? <ActionsRenderer actionsAtom={thisRoute.actions} /> : null}
          </RouteSync>
        ),
      });
    }
    return acc;
  }, []);
});

const ActionsRenderer = ({ actionsAtom }: { actionsAtom: Atom<{ config: Config; counter: number }> }) => {
  const [{ config: actions, counter }] = useAtom(actionsAtom);
  return counter ? (
    <Actions>
      <ConfigRenderer>{actions}</ConfigRenderer>
    </Actions>
  ) : null;
};

export const Router = () => {
  const [routerRoutes] = useAtom(routesAtom);
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

export const PrimaryTitle = ({ children: title }: { children: string }) => {
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, [title]);

  return (
    <DesktopOnly>
      <h2>{title}</h2>
    </DesktopOnly>
  );
};
