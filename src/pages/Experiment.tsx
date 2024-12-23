import { atom, useAtom } from "jotai";
import { useParams } from "react-router";

import { ForkButton } from "../components";
import { ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { type ExperimentCursor, type Message, getExperimentAtom } from "../state/common";
import { Button, Sidebar } from "../style";
import { entangledAtom } from "../utils/entanglement";
import { Actions, Page } from "./_page";

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
      <Page>
        <h1>
          Experiment {id}.{runId}
        </h1>
        <ChatPreview key={id + runId} history={experiment ?? []} />
      </Page>
      <Actions>
        <Sidebar>
          <h3>Actions</h3>
          <p>
            <ForkButton experiment={experiment} parent={id} />
            <Button
              type="submit"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(experiment));
              }}
            >
              Copy JSON
            </Button>
          </p>
        </Sidebar>
      </Actions>
      <ExperimentsSidebar />
    </>
  );
}
