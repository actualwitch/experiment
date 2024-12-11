import { atom, useAtom } from "jotai";
import { useParams } from "react-router";

import { ForkButton } from "../components";
import { ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { type ExperimentCursor, type Message, getExperimentAtom } from "../state/common";
import { entangledAtom } from "../utils/entanglement";

const cursorAtom = entangledAtom("cursor", atom<ExperimentCursor | null>(null));
const selectedExperimentAtom = entangledAtom(
  "selected-experiment",
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
        <ForkButton experiment={experiment} parent={id} />
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
