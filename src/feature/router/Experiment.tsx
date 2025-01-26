import { atom, useAtom, useSetAtom, type Setter } from "jotai";
import { useParams } from "react-router";

import { ChatPreview, selectionAtom } from "../../components/chat";
import {
  experimentAtom,
  type ExperimentCursor,
  getExperimentAtom,
  parentAtom,
  templatesAtom,
} from "../../atoms/common";
import { entangledAtom } from "../../utils/entanglement";
import { Actions, Page } from "./_page";
import type { Experiment } from "../../types";
import { DesktopOnly } from "../../components/Mobile";
import { useEffect, useMemo } from "react";
import { View } from "../../components/view";
import { navigateAtom, titleOverrideAtom } from ".";
import { ConfigRenderer, type Config } from "../../components/ConfigRenderer";

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
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions>
    </>
  );
}
