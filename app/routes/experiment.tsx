import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { SidebarInput } from "~/navigation";
import { experimentIdsAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";

export const loader = async () => {
  return { experimentIds: store.get(experimentIdsAtom) };
};

export default function Experiment() {
  const { experimentIds } = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet />
      <SidebarInput>
        <h3>Experiments</h3>
        <ul>
          {experimentIds.map(([id, subId]) => (
            <li key={id}>
              <NavLink to={`/experiment/${id}/${subId}`}>
                Experiment #{id}.{subId}
              </NavLink>
            </li>
          ))}
        </ul>
      </SidebarInput>
    </>
  );
}
