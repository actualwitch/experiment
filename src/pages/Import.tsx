import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import { ForkButton } from "../components";
import { ChatPreview } from "../components/chat";
import { View } from "../components/view";
import { SidebarInput } from "../navigation";
import { filenames, importsRegistry, processCsvAtom, selectedChat } from "../state/client";
import { Sidebar } from "../style";

const SidebarContents = () => {
  const [chats] = useAtom(filenames);
  const [registry] = useAtom(importsRegistry);
  const [_, setSelectedChat] = useAtom(selectedChat);
  const entries = chats.reduce((acc, chatId) => {
    acc[chatId] = registry[chatId].map((chat, idx) => `Experiment ${idx}`);
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
    <input
      type="file"
      accept=".csv"
      onChange={(e) => {
        processFile(e.target.files?.[0]);
      }}
    />
  );
};

export default function () {
  const [selected] = useAtom(selectedChat);
  const [registry] = useAtom(importsRegistry);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);

  const [filename, idx] = selected ?? [];
  const chat = filename && idx ? registry[filename][idx] : undefined;

  return (
    <>
      {chat ?
        <ChatPreview key={`${filename}-${idx}`} history={chat} />
      : <div />}
      <Sidebar>
        <h3>Actions</h3>
        <p>Import csv</p>
        <CsvInput />
        {selected && (
          <div>
            <ForkButton experiment={chat} />
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(JSON.stringify(chat));
              }}
            >
              Copy as json
            </button>
          </div>
        )}
      </Sidebar>
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
