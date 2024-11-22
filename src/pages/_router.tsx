import { Route, Routes } from "react-router-dom";
import Experiment from "./Experiment";
import Import from "./Import";
import NewExperiment from "./NewExperiment";
import Parameters from "./Parameters";
import Templates from "./Templates";
import { useSetAtom } from "jotai";
import { iconAtom, titleAtom } from "../state/meta";
import { useEffect, type PropsWithChildren } from "react";
import { TRIANGLE } from "../const";

type RouteList = Array<{
  icon: string;
  title: string;
  path: string;
  component: () => JSX.Element;
  showInSidebar?: boolean;
}>;

export const ROUTES: RouteList = [
  { icon: "🔬", title: "Experiment", showInSidebar: true, path: "/", component: NewExperiment },
  { icon: "🔬", title: "Experiment", showInSidebar: false, path: "/experiment/:id/:runId", component: Experiment },
  { icon: "⛴️", title: "Import", showInSidebar: true, path: "/import", component: Import },
  { icon: "📝", title: "Templates", showInSidebar: true, path: "/templates", component: Templates },
  { icon: "🔧", title: "Parameters", showInSidebar: true, path: "/parameters", component: Parameters },
];

function IconAndTitleUpdater({ icon, title, children }: PropsWithChildren<{ icon: string; title: string }>) {
  const setTitle = useSetAtom(titleAtom);
  const setIcon = useSetAtom(iconAtom);
  useEffect(() => {
    const newTitle = title === "Experiment" ? title : `${title} ${TRIANGLE} Experiment`;
    setTitle(newTitle);
    setIcon(icon);
  }, [title, icon]);
  return children;
}

export const Router = () => {
  return (
    <Routes>
      {ROUTES.map(({ path, component: Component, title, icon }) => (
        <Route
          key={path}
          path={path}
          element={
            <IconAndTitleUpdater title={title} icon={icon}>
              <Component />
            </IconAndTitleUpdater>
          }
        />
      ))}
    </Routes>
  );
};
