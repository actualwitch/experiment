import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router";

import { navigateAtom, paramsAtom, titleOverrideAtom } from ".";
import { selectionAtom, templatesAtom } from "../../atoms/common";
import type { ExperimentCursor } from "../../atoms/experiment";
import { getExperimentAtom } from "../../atoms/store";
import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import type { Config } from "../ui/ConfigRenderer";
import { createRemixButtons, createSelectionEditButtons } from "../ui/ConfigRenderer/buttonCreators";
import { DesktopOnly } from "../ui/Mobile";
import { Page } from "../ui/Page";
import { useScrollToTopRef } from "../../utils/scroll";

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

export const actionsAtom = atom((get) => {
  const selection = get(selectionAtom);
  const experiment = get(selectedExperimentAtom);
  const params = get(paramsAtom);
  const navigate = get(navigateAtom);
  const templates = get(templatesAtom);
  let counter = 0;
  const config: Config = {
    Actions: [],
  };
  {
    const buttons = createRemixButtons(experiment, params?.id, navigate);
    config.Actions.push({
      buttons,
    });
    counter += buttons.length;
  }
  if (selection !== null && selection[0] !== undefined) {
    const buttons = createSelectionEditButtons(
      templates,
      (Array.isArray(experiment) ? experiment : experiment.messages)[selection[0]],
    );
    config.Actions.push({
      Selection: {
        buttons,
      },
    });
    counter += buttons.length;
  }
  return { config, counter };
});

export default function () {
  const [{ id, runId }] = useAtom(paramsAtom);

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
  }, [title]);

  const pageRef = useScrollToTopRef([experiment]);

  return (
    <Page ref={pageRef}>
      <DesktopOnly>
        <h2>{title}</h2>
      </DesktopOnly>
      <ExperimentPreview key={title} experiment={experiment} />
    </Page>
  );
}
