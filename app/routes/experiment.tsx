import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { createEntanglement, entangledResponse } from "~/again";
import { SidebarInput } from "~/navigation";
import { experimentIdsAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";


const idsAtom = atom<[string, string][]>([]);
const atoms = { idsAtom };

export async function loader() {
  store.set(idsAtom, store.get(experimentIdsAtom));
  return entangledResponse(atoms);
}

const {useEntangledAtoms} = createEntanglement(atoms);

export default function Experiment() {
  useEntangledAtoms();
  const [experimentIds] = useAtom(idsAtom);
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
