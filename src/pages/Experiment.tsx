import { atom, useAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { ChatPreview } from "../components/chat";
import { getExperimentAtom, experimentAtom, store, type ExperimentCursor, type Message } from "../state/common";
import { useEffect, useMemo } from "react";
import { getRealm } from "../utils";
import { entangledAtom } from "../state/entanglement";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { tracingAtom } from "../utils/dbg";

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
        store.set(selectedExperimentAtom, get(getExperimentAtom(cursor)));
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
            store.set(
              experimentAtom,
              experiment,
            );
            navigate("/");
          }}>
          use in new experiment
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
