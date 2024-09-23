import { useNavigate, useSubmit } from "@remix-run/react";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";

import { expandedChatIds, filenames, importsRegistry, processCsvAtom, selectedChat } from "~/state/client";
import { newChatAtom, store } from "~/state/common";
import { Main, Message } from "~/style";

export { defaultMeta as meta } from "~/meta";

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
  if (typeof idx !== "number") return <p>Invalid selection</p>;
  const chat = registry[filename][idx];
  return (
    <>
      <Main>
        {chat.messages.map((message, idx) => (
          <Message key={idx} role={message.role} isSelected={false} >
            <code>{message.content}</code>
          </Message>
        ))}
        {chat.response.content && (
          <Message key="response" role={chat.response.role} isSelected={false} >
            <code>{chat.response.content}</code>
          </Message>
        )}

        {chat.response.tool_calls?.map((toolCall, idx) => {
          return (
            <Message key={"tool" + idx} role="tool" isSelected={false} >
              <code>{JSON.stringify(toolCall, null, 2)}</code>
            </Message>
          );
        })}
      </Main>
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
  const sidebar = useSidebar();
  return (
    <>
      <Imports />
      {sidebar && createPortal(<Sidebar />, sidebar)}
    </>
  );
}
