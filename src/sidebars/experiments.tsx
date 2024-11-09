import { useAtom } from "jotai";
import { NavLink } from "react-router-dom";
import { SidebarInput } from "../navigation";
import { experimentIdsAtom } from "../state/common";

export function ExperimentsSidebar() {
  const [experimentIds] = useAtom(experimentIdsAtom);
  return (
    <SidebarInput>
      <h3>History</h3>
      <ul>
        {[...experimentIds].reverse().map(([id, subId]) => (
          <li key={id + subId}>
            <NavLink to={`/experiment/${id}/${subId}`}>
              Experiment {id}.{subId}
            </NavLink>
          </li>
        ))}
      </ul>
    </SidebarInput>
  );
}
