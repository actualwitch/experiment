import { atom, useAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { ChatPreview } from "../components/chat";
import { getExperimentAtom, newChatAtom, store, type ExperimentCursor, type Message } from "../state/common";
import { useEffect, useMemo } from "react";
import { getRealm } from "../utils";
import { entangledAtom } from "../state/entanglement";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { tracingAtom } from "../utils/dbg";

const cursorAtom = entangledAtom({ name: "cursor", mode: "server" }, atom<ExperimentCursor | null>(null));

export const experimentAtom = entangledAtom(
  {
    name: "selected-experiment",
    mode: "readOnly",
  },
  atom<Message[]>([]),
);

const actionAtom = entangledAtom(
  "action",
  atom((get) => {
    if (getRealm() === "server") {
      const cursor = get(cursorAtom);
      if (cursor) {
        store.set(experimentAtom, get(getExperimentAtom(cursor)));
      }
    }
  }),
);

export default function Experiment() {
  const navigate = useNavigate();
  const { id, runId } = useParams();
  const [cursor] = useAtom(cursorAtom);
  const [experiment] = useAtom(experimentAtom);
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
              newChatAtom,
              experiment!.filter((msg) => !msg.fromServer),
            );
            navigate("/");
          }}>
          new experiment
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
