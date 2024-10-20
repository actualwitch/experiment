import { useNavigate, useSubmit } from "@remix-run/react";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { ChatContainer, ChatMessage } from "~/chat";
import { SidebarInput } from "~/navigation";

import { filenames, importsRegistry, processCsvAtom, selectedChat } from "~/state/client";
import { newChatAtom, store } from "~/state/common";
import { View } from "~/view";

export { defaultMeta as meta } from "~/meta";

export const Sidebar = () => {
  const [chats] = useAtom(filenames);
  const [registry] = useAtom(importsRegistry);
  const [_, setSelectedChat] = useAtom(selectedChat);
  const entries = chats.reduce((acc, chatId) => {
    acc[chatId] = registry[chatId].map((chat, idx) => `Chat ${idx}`);
    return acc;
  }, {} as any);

  return (
    <>
      {chats.length > 0 ? (
        <View onClick={(value, key, path) => {
          const [parent] = path;
          setSelectedChat([parent, key!]);
        }}>{entries}</View>
      ) : (
        <p>Import csv</p>
      )}
      <CsvInput />
    </>
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

function Imports() {
  const [selected] = useAtom(selectedChat);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);

  const [registry] = useAtom(importsRegistry);
  const submit = useSubmit();
  const navigate = useNavigate();

  if (!selected) return <p>Nothing selected</p>;
  const [filename, idx] = selected;
  const chat = registry[filename][idx];
  const experiment = [
    ...chat.messages,
    ...(chat.response.content ? [{ ...chat.response, role: "assistant", fromServer: true }] : []),
    ...(chat.response.tool_calls || []).map((toolCall) => ({ content: toolCall, role: "tool", fromServer: true })),
  ];
  return (
    <>
      <ChatContainer>
        {experiment?.map?.((message, index) => {
          return <ChatMessage key={index} message={message} index={index} />;
        })}
      </ChatContainer>
      <aside>
        <h3>Actions</h3>
        <div>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              store.set(newChatAtom, chat.messages);
              navigate("/");
            }}>
            Start experiment
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(JSON.stringify(chat.messages));
            }}>
            Copy to clipboard
          </button>
        </div>
      </aside>
    </>
  );
}

export default function () {
  return (
    <>
      <Imports />
      <SidebarInput>
        <Sidebar />
      </SidebarInput>
    </>
  );
}
