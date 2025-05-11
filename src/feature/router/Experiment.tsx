import { atom, useAtom, useSetAtom, type Setter } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router";

import { navigateAtom, paramsAtom, PrimaryTitle, titleOverrideAtom } from ".";
import { selectionAtom, templatesAtom } from "../../atoms/common";
import type { ExperimentCursor } from "../../atoms/experiment";
import { deleteExperiment, getExperimentAtom } from "../../atoms/experiment";
import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import type { Config } from "../ui/ConfigRenderer";
import { createRemixButtons, createSelectionEditButtons } from "../ui/ConfigRenderer/buttonCreators";
import { DesktopOnly } from "../ui/Mobile";
import { Page } from "../ui/Page";
import { useScrollToTopRef } from "../../utils/scroll";
import { Trash2 } from "lucide-react";
import { subjectAtom } from "../ui/Navigation";
import { ChatPreview } from "../chat/chat";

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
    const buttons = [
      ...createRemixButtons(experiment, params?.id, navigate),
      {
        label: "Delete",
        icon: Trash2,
        action: (set: Setter) => {
          set(deleteExperiment, params);
        },
      },
    ];
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

  const [subject] = useAtom(subjectAtom);

  const title = `${subject} #${id}.${runId}`;

  const pageRef = useScrollToTopRef([experiment]);

  return (
    <Page ref={pageRef}>
      <PrimaryTitle>{title}</PrimaryTitle>
      <ChatPreview key={title} experiment={experiment} />
    </Page>
  );
}
