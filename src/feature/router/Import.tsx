import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import templates from "../../../fixtures/templates.json";
import { ForkButton } from "../../components";
import { ChatPreview } from "../../components/chat";
import { View } from "../../components/view";
import { SidebarInput } from "./navigation";
import { filenames, importsRegistry, processCsvAtom, selectedChat } from "../../atoms/client";
import { layoutAtom } from "../../atoms/common";
import { Button } from "../../style";
import { Actions, Page } from "./_page";
import { titleOverrideAtom } from "../../atoms/meta";
import { DesktopOnly } from "../../components/Mobile";
import type { ExperimentWithMeta } from "../../types";

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
  const [layout] = useAtom(layoutAtom);

  const [selected, setSelected] = useAtom(selectedChat);
  const [registry, setRegistry] = useAtom(importsRegistry);
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
  const chat: ExperimentWithMeta | undefined = filename && idx ? registry[filename][idx] : undefined;

  const title = "Import CSV";
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  return (
    <>
      <Page>
        {chat ?
          <ChatPreview key={`${filename}-${idx}`} messages={chat.messages} />
        : <>
            <DesktopOnly>
              <h2>{title}</h2>
            </DesktopOnly>
            <p>
              Import and explore previous completions from CSV files, or{" "}
              <a
                onClick={() => {
                  const samples = Object.entries(templates).reduce((acc, [id, value]) => {
                    return [...acc, { ...value, id }];
                  }, []);
                  setRegistry({
                    ...registry,
                    Samples: samples,
                  });
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
            <ForkButton experiment={chat?.messages} />
            <Button
              type="submit"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(chat));
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