import { atom, useAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import {
  type ExperimentCursor,
  type Message,
  getExperimentAtom,
  experimentAtom as newExperimentAtom,
} from "../state/common";
import { store } from "../state/store";
import { entangledAtom } from "../utils/entanglement";

const cursorAtom = entangledAtom({ name: "cursor" }, atom<ExperimentCursor | null>(null));

export const selectedExperimentAtom = entangledAtom(
  {
    name: "selected-experiment",
  },
  atom<Message[]>((get) => {
    const cursor = get(cursorAtom);
    if (cursor) {
      const experiment = get(getExperimentAtom(cursor));
      return experiment ?? [];
    }
    return [];
  }),
);

export default function Experiment() {
  const navigate = useNavigate();
  const { id, runId } = useParams();
  const [cursor, setCursor] = useAtom(cursorAtom);
  const [experiment] = useAtom(selectedExperimentAtom);
  if (id && runId && (!cursor || cursor.id !== id || cursor.runId !== runId)) {
    setCursor({ id, runId });
  }

  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        <ChatPreview history={experiment ?? []} />
      </div>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            store.set(newExperimentAtom, experiment);
            navigate("/");
          }}
        >
          begin anew
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
