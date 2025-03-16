import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router";

import { navigateAtom, titleOverrideAtom } from ".";
import { type ExperimentCursor, getExperimentAtom, selectionAtom, templatesAtom } from "../../atoms/common";
import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import { Actions } from "../ui/Actions";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
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

export const paramsAtom = atom<Record<string, string | undefined>>({});

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
  const params = useParams();
  const { id, runId } = params;
  const setParams = useSetAtom(paramsAtom);
  useEffect(() => setParams(params), [params]);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const [experiment] = useAtom(selectedExperimentAtom);
  if (id && runId && (!cursor || cursor.id !== id || cursor.runId !== runId)) {
    setCursor({ id, runId });
  }

  const [{ config, counter }] = useAtom(actionsAtom);

  const title = `Experiment #${id}.${runId}`;
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  const pageRef = useScrollToTopRef([experiment]);

  return (
    <>
      <Page ref={pageRef}>
        <DesktopOnly>
          <h2>{title}</h2>
        </DesktopOnly>
        <ExperimentPreview key={title} experiment={experiment} />
      </Page>
      <Actions>
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions>
    </>
  );
}
