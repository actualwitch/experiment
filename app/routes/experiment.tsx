import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useAtom } from "jotai";
import { createPortal } from "react-dom";
import { SidebarInput } from "~/navigation";
import { experimentIdsAtom, store } from "~/state/common";

export const loader = async () => {
  return { experimentIds: store.get(experimentIdsAtom) };
};

export default function Experiment() {
  //   const [experimentIds] = useAtom(experimentIdsAtom);
  const { experimentIds } = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet />
      <SidebarInput>
        <h3>Experiments</h3>
        <ul>
          {experimentIds.map(([id, subId]) => (
            <li key={id}>
              <NavLink to={`/experiment/lite/${id}/${subId}`}>
                Experiment #{id}.{subId}
              </NavLink>
            </li>
          ))}
        </ul>
      </SidebarInput>
    </>
  );
}
