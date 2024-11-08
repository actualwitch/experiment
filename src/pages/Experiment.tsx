import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { experimentAtom, getExperimentAtom, type ExperimentCursor, type Message } from "../state/common";
import { entangledAtom } from "../state/entanglement";
import { store } from "../state/store";
import { getRealm } from "../utils";

const cursorAtom = entangledAtom({ name: "cursor" }, atom<ExperimentCursor | null>(null));

export const selectedExperimentAtom = entangledAtom(
  {
    name: "selected-experiment",
  },
  atom<Message[]>([]),
);

const actionAtom = entangledAtom(
  "action",
  atom((get) => {
    if (getRealm() === "server") {
      const cursor = get(cursorAtom);
      if (cursor) {
        const experiment = get(getExperimentAtom(cursor));
        store.set(selectedExperimentAtom, experiment ?? []);
      }
    }
  }),
);

export default function Experiment() {
  const navigate = useNavigate();
  const { id, runId } = useParams();
  const [cursor] = useAtom(cursorAtom);
  const [experiment] = useAtom(selectedExperimentAtom);
  useAtom(actionAtom);

  if (!cursor && id && runId) {
    store.set(cursorAtom, { id, runId });
  }

  useEffect(() => {
    if (id && runId) {
      store.set(cursorAtom, { id, runId });
    }
  }, [id, runId]);

  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        <ChatPreview history={experiment || []} />
      </div>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            store.set(experimentAtom, experiment);
            navigate("/");
          }}>
          use in new experiment
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
