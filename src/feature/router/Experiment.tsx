import { type Setter, atom, useAtom, useSetAtom } from "jotai";
import { useParams } from "react-router";
import { useEffect } from "react";

import { navigateAtom, titleOverrideAtom } from ".";
import {
  type ExperimentCursor,
  experimentAtom,
  getExperimentAtom,
  parentAtom,
  templatesAtom,
} from "../../atoms/common";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import { selectionAtom } from "../chat/chat";
import { Actions } from "../ui/Actions";
import { DesktopOnly } from "../ui/Mobile";
import { Page } from "../ui/Page";

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
  let counter = 0;
  const config: Config = {
    Actions: [],
  };
  {
    config.Actions.push({
      buttons: [
        {
          label: "Fork",
          action: (set: Setter) => {
            if (!experiment) return;
            const messages = Array.isArray(experiment) ? experiment : experiment.messages;
            set(experimentAtom, messages);
            if (parent) set(parentAtom, params?.id);
            navigate?.("/");
          },
        },
        {
          label: "Copy",
          action: (set: Setter) => void navigator.clipboard.writeText(JSON.stringify(experiment)),
        },
      ],
    });
    counter += 2;
  }
  if (selection !== null) {
    config.Actions.push({
      Selection: {
        buttons: [
          {
            label: "Unselect",
            action: (set: Setter) => set(selectionAtom, null),
          },
          {
            label: "Template",
            action: async (set: Setter) => {
              const name = prompt("Name of the template");
              if (!name) return;
              const templates = get(templatesAtom);
              const experiment = get(selectedExperimentAtom);
              set(templatesAtom, { ...templates, [name]: experiment[selection[0]] });
            },
          },
        ],
      },
    });
    counter++;
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

  return (
    <>
      <Page>
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
