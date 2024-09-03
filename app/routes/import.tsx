import type { MetaFunction } from "@remix-run/node";
import DOMPurify from "dompurify";
import { useAtom } from "jotai";
import { parse } from "marked";
import { useEffect, useState } from "react";

import { expandedChatIds, filenames, importsRegistry, selectedChat } from "~/state/client";
import { Main } from "~/style";

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export const Sidebar = () => {
  const [chats] = useAtom(filenames);
  const [expandedChats, setExpandedChatIds] = useAtom(expandedChatIds);
  return (
    <>
      {chats.length > 0 ? (
        chats.map((chatId) => {
          const isExpanded = expandedChats.includes(chatId);
          return (
            <section key={chatId}>
              <h3
                onClick={() => {
                  setExpandedChatIds((prev) =>
                    prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId],
                  );
                }}>
                <span>{isExpanded ? "-" : "+"} </span>
                {chatId}
              </h3>
              {isExpanded && (
                <ul>
                  <ChildEntries filename={chatId} />
                </ul>
              )}
            </section>
          );
        })
      ) : (
        <p>Import csv</p>
      )}
      <CsvInput />
    </>
  );
};

const CsvInput = () => {
  const [_, setRegistry] = useAtom(importsRegistry);
  const [file, setFile] = useState<File | undefined>(undefined);
  useEffect(() => {
    if (!file || file.type !== "text/csv") return;
    const fileName = file.name.slice(0, -4);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const file = e.target?.result;
      if (!file) return;
      const { default: csv } = await import("csvtojson");
      const lines = await csv().fromString(file.toString());
      const chats = lines.map(({ messages, choice }) => ({
        messages: JSON.parse(messages),
        response: JSON.parse(choice).message,
      }));
      setRegistry((prev) => ({
        ...prev,
        [fileName]: chats,
      }));
    };
    reader.readAsText(file);
  }, [file]);

  return (
    <input
      type="file"
      accept=".csv"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setFile(file);
        }
      }}
    />
  );
};

const ChildEntries = ({ filename }: { filename: string }) => {
  const [registry] = useAtom(importsRegistry);
  const chats = registry[filename];
  const [_, setSelectedChat] = useAtom(selectedChat);
  return (
    <div>
      {chats.map((chat, idx) => (
        <div
          key={idx}
          onClick={() => {
            setSelectedChat([filename, idx]);
          }}>
          Chat {idx + 1}
        </div>
      ))}
    </div>
  );
};

export default function Imports() {
  const [selected] = useAtom(selectedChat);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);

  const [registry] = useAtom(importsRegistry);
  if (!selected) return <p>Nothing selected</p>;
  const [filename, idx] = selected;
  if (typeof idx !== "number") return <p>Invalid selection</p>;
  const chat = registry[filename][idx];
  return (
    <>
      <Main>
        {chat.messages.map((message, idx) => (
          <div key={idx}>
            <header>{message.role}</header>
            {message.content && (
              <p
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(parse(message.content, { async: false })),
                }}
              />
            )}
          </div>
        ))}
        <div>
          <header>{chat.response.role}</header>

          {chat.response.content && (
            <p
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(parse(chat.response.content, { async: false })),
              }}
            />
          )}
        </div>
        {chat.response.tool_calls && (
          <>
            <header>Tool Calls</header>
            <pre>{JSON.stringify(chat.response.tool_calls, null, 2)}</pre>
          </>
        )}
      </Main>
      <div>
        <h3>Actions</h3>
        <button>Add to staging</button>
      </div>
    </>
  );
}
