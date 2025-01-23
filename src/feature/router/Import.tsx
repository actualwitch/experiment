import { useAtom, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";

import templates from "../../../fixtures/templates.json";
import { ForkButton } from "../../components";
import { ChatPreview } from "../../components/chat";
import { View } from "../../components/view";
import { SidebarInput } from "./navigation";
import { filenames, importsRegistry, processCsvAtom, selectedChat } from "../../atoms/client";
import { Button } from "../../style";
import { Actions, Page } from "./_page";
import { DesktopOnly } from "../../components/Mobile";
import type { ExperimentWithMeta } from "../../types";
import { titleOverrideAtom } from ".";
import { isNavPanelOpenAtom, layoutAtom } from "../../atoms/common";

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

const CsvInput = () => {
  const processFile = useSetAtom(processCsvAtom);

  return (
    <p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          processFile(e.target.files?.[0]);
        }}
      />
    </p>
  );
};

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
  const experiment: ExperimentWithMeta | undefined = filename && idx ? registry[filename][idx] : undefined;

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
        <h3>Actions</h3>
        <CsvInput />
        {selected && (
          <div>
            <ForkButton experiment={experiment} />
            <Button
              type="submit"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(experiment));
              }}
            >
              Copy JSON
            </Button>
          </div>
        )}
      </Actions>
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
