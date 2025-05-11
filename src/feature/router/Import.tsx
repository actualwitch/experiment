import { atom, useAtom } from "jotai";
import { useEffect } from "react";

import { PrimaryTitle, navigateAtom } from ".";
import templates from "../../../fixtures/templates.json";
import testing from "../../../fixtures/testing.json";
import { filenames, importsRegistry, selectedChat } from "../../atoms/client";
import { debugAtom, isNavPanelOpenAtom, layoutAtom, selectionAtom, templatesAtom } from "../../atoms/common";
import type { ExperimentWithMeta } from "../../types";
import { ChatPreview } from "../chat/chat";
import { type Config } from "../ui/ConfigRenderer";
import { createRemixButtons, createSelectionEditButtons } from "../ui/ConfigRenderer/buttonCreators";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";
import { View } from "../ui/view";

const SidebarContents = () => {
  const [chats] = useAtom(filenames);
  const [registry] = useAtom(importsRegistry);
  const [_, setSelectedChat] = useAtom(selectedChat);
  const entries = chats.reduce((acc, chatId) => {
    acc[chatId] = registry[chatId].map((chat, idx) => chat.id ?? `Experiment ${idx}`);
    return acc;
  }, {} as any);
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
  if (selection !== null && selection[0] !== undefined && experiment) {
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
          <>
            <PrimaryTitle>{experiment.id}</PrimaryTitle>
            <ChatPreview key={`${filename}-${idx}`} experiment={experiment} />
          </>
        ) : (
          <>
            <PrimaryTitle>{title}</PrimaryTitle>
            <p>
              Import and analyze previous completions from CSV files to review past experiments or share results with
              your team.
            </p>
            <p>
              <strong>How to use:</strong>
            </p>
            <ul>
              <li>Click "Import CSV" to upload a file with previous model completions</li>
              <li>CSV files should contain columns with JSON-formatted messages</li>
              <li>Select any imported experiment to view its contents</li>
              <li>Use the "Fork" button to continue working with any imported experiment</li>
            </ul>
            <p>
              <a onClick={addSamples}>See example experiments</a> to understand the format and capabilities.
            </p>
          </>
        )}
      </Page>
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
