import { type Setter, atom, useAtom } from "jotai";
import { useEffect } from "react";

import { navigateAtom, titleOverrideAtom } from ".";
import templates from "../../../fixtures/templates.json";
import testing from "../../../fixtures/testing.json";
import { filenames, importsRegistry, selectedChat } from "../../atoms/client";
import { debugAtom, isNavPanelOpenAtom, layoutAtom, selectionAtom, templatesAtom } from "../../atoms/common";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
import { View } from "../ui/view";
import type { ExperimentWithMeta } from "../../types";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import { Actions } from "../ui/Actions";
import { DesktopOnly } from "../ui/Mobile";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";
import { createRemixButtons, createSelectionEditButtons } from "../ui/ConfigRenderer/buttonCreators";

const SidebarContents = () => {
  const [chats] = useAtom(filenames);
  const [registry] = useAtom(importsRegistry);
  const [_, setSelectedChat] = useAtom(selectedChat);
  const entries = chats.reduce((acc, chatId) => {
    acc[chatId] = registry[chatId].map((chat, idx) => chat.id ?? `Experiment ${idx}`);
    return acc;
  }, {} as any);
  if (chats.length === 0) {
    return null;
  }
  return (
    <View
      disableSorting
      onClick={(value, key, path) => {
        const [parent] = path;
        setSelectedChat([parent, key!]);
      }}
    >
      {entries}
    </View>
  );
};

const selectedExperimentAtom = atom((get) => {
  const [filename, idx] = get(selectedChat) ?? [];
  return filename && idx ? get(importsRegistry)[filename][idx] : undefined;
});

export const actionsAtom = atom((get) => {
  const selection = get(selectionAtom);
  const experiment = get(selectedExperimentAtom);
  const navigate = get(navigateAtom);
  const templates = get(templatesAtom);
  let counter = 0;
  const config: Config = {
    Actions: [],
  };
  config.Actions.push({
    type: "csv",
    label: "Import CSV",
  });
  counter += 1;
  if (experiment) {
    const buttons = createRemixButtons(experiment, undefined, navigate);
    config.Actions.push({
      buttons,
    });
    counter += buttons.length;
  }
  if (selection !== null && experiment) {
    const messages = Array.isArray(experiment) ? experiment : experiment.messages;
    const buttons = createSelectionEditButtons(templates, messages[selection[0]]);
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
  const [selected, setSelected] = useAtom(selectedChat);
  const [registry, setRegistry] = useAtom(importsRegistry);
  const [layout] = useAtom(layoutAtom);
  const [_, setIsNavPanelOpen] = useAtom(isNavPanelOpenAtom);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);
  useEffect(
    () => () => {
      setSelected(undefined);
    },
    [],
  );

  const [filename, idx] = selected ?? [];
  const [experiment, setExperiment] = useAtom(selectedExperimentAtom);

  const title = "Import CSV";
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  const [{ config, counter }] = useAtom(actionsAtom);

  const [debug] = useAtom(debugAtom);

  const addSamples = () => {
    let { Samples: _, ...newRegistry } = registry;
    const samples = Object.entries(templates).reduce<ExperimentWithMeta[]>((acc, [name, experiment]) => {
      acc.push({ ...experiment, id: name });
      return acc;
    }, []);
    if (debug) {
      samples.push(
        ...Object.entries(testing).reduce<ExperimentWithMeta[]>((acc, [name, experiment]) => {
          acc.push({ ...experiment, id: name });
          return acc;
        }, []),
      );
    }
    newRegistry = { Samples: samples, ...newRegistry };
    setRegistry(newRegistry);
    if (layout === "mobile") {
      setIsNavPanelOpen(true);
    }
  };

  return (
    <>
      <Page>
        {experiment ? (
          <ExperimentPreview key={`${filename}-${idx}`} experiment={experiment} />
        ) : (
          <>
            <DesktopOnly>
              <h2>{title}</h2>
            </DesktopOnly>
            <p>
              Import and explore previous completions from CSV files, or <a onClick={addSamples}>see some examples</a>.
            </p>
          </>
        )}
      </Page>
      <Actions>
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions>
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
