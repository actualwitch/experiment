import { type Setter, atom, useAtom } from "jotai";
import { useEffect, useMemo } from "react";

import { navigateAtom, titleOverrideAtom } from ".";
import templates from "../../../fixtures/templates.json";
import { filenames, importsRegistry, selectedChat } from "../../atoms/client";
import { experimentAtom, isNavPanelOpenAtom, layoutAtom, templatesAtom } from "../../atoms/common";
import { type Config, ConfigRenderer } from "../../components/ConfigRenderer";
import { DesktopOnly } from "../../components/Mobile";
import { ChatPreview, selectionAtom } from "../../components/chat";
import { View } from "../../components/view";
import type { ExperimentWithMeta } from "../../types";
import { Actions, Page } from "./_page";
import { SidebarInput } from "./navigation";

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
    config.Actions.push({
      buttons: [
        {
          label: "Fork",
          action: (set: Setter) => {
            if (!experiment) return;
            const messages = Array.isArray(experiment) ? experiment : experiment.messages;
            set(experimentAtom, messages);
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
  const meta = useMemo(() => {
    if (Array.isArray(experiment) || !experiment) {
      return null;
    }
    const { messages, ...meta } = experiment;
    return meta;
  }, [experiment]);

  const [{ config, counter }] = useAtom(actionsAtom);

  return (
    <>
      <Page>
        {experiment ?
          <>
            {meta && <View>{meta}</View>}
            <ChatPreview key={`${filename}-${idx}`} experiment={experiment} />
          </>
        : <>
            <DesktopOnly>
              <h2>{title}</h2>
            </DesktopOnly>
            <p>
              Import and explore previous completions from CSV files, or{" "}
              <a
                onClick={() => {
                  const samples = Object.entries(templates).reduce<ExperimentWithMeta[]>((acc, [name, experiment]) => {
                    return [...acc, { ...experiment, id: name }];
                  }, []);
                  setRegistry({
                    ...registry,
                    Samples: samples,
                  });
                  if (layout === "mobile") {
                    setIsNavPanelOpen(true);
                  }
                }}
              >
                see some examples
              </a>
              .
            </p>
          </>
        }
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
