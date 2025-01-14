import { atom, useAtom } from "jotai";
import { useParams } from "react-router";

import { ForkButton } from "../../components";
import { ChatPreview } from "../../components/chat";
import { type ExperimentCursor, getExperimentAtom } from "../../atoms/common";
import { Button } from "../../style";
import { entangledAtom } from "../../utils/entanglement";
import { Actions, Page } from "./_page";
import type { Message } from "../../types";
import { titleOverrideAtom } from "../../atoms/meta";
import { DesktopOnly } from "../../components/Mobile";
import { useEffect } from "react";

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

  const title = `Experiment #${id}.${runId}`;
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  return (
    <>
      <Page>
        <DesktopOnly>
          <h2>{title}</h2>
        </DesktopOnly>
        <ChatPreview key={id + runId} messages={experiment ?? []} />
      </Page>
      <Actions>
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
      </Actions>
    </>
  );
}
