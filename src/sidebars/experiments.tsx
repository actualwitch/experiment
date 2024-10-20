import { useAtom } from "jotai";
import { experimentIdsAtom } from "../state/common";
import { SidebarInput } from "../navigation";
import { NavLink } from "react-router-dom";

export function ExperimentsSidebar() {
  const [experimentIds] = useAtom(experimentIdsAtom);
  return (
    <SidebarInput>
      <h3>Experiments</h3>
      <ul>
        {experimentIds.map(([id, subId]) => (
          <li key={id + subId}>
            <NavLink to={`/experiment/${id}/${subId}`}>
              Experiment #{id}/{subId}
            </NavLink>
          </li>
        ))}
      </ul>
    </SidebarInput>
  );
}
