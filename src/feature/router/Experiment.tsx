import { atom, useAtom } from "jotai";
import { useParams } from "react-router";

import { ForkButton } from "../../components";
import { ChatPreview } from "../../components/chat";
import { type ExperimentCursor, getExperimentAtom } from "../../atoms/common";
import { Button } from "../../style";
import { entangledAtom } from "../../utils/entanglement";
import { Actions, Page } from "./_page";
import type { Experiment } from "../../types";
import { titleOverrideAtom } from "../../atoms/meta";
import { DesktopOnly } from "../../components/Mobile";
import { useEffect, useMemo } from "react";
import { View } from "../../components/view";

const cursorAtom = entangledAtom("cursor", atom<ExperimentCursor | null>(null));
const selectedExperimentAtom = entangledAtom(
  "selected-experiment",
  atom<Experiment>((get) => {
    const cursor = get(cursorAtom);
    if (cursor) {
      const experiment = get(getExperimentAtom(cursor));
      return experiment ?? [];
    }
    return [];
  }),
);
export default function () {
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

  const meta = useMemo(() => {
    if (Array.isArray(experiment)) {
      return null;
    }
    const { messages, ...meta } = experiment;
    return meta;
  }, [experiment]);

  return (
    <>
      <Page>
        <DesktopOnly>
          <h2>{title}</h2>
        </DesktopOnly>
        {meta && <View>{meta}</View>}
        <ChatPreview key={title} experiment={experiment} />
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
