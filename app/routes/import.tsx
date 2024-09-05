import { css, SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";
import DOMPurify from "dompurify";
import { useAtom, useSetAtom } from "jotai";
import { parse } from "marked";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSidebar } from "~/navigation";

import { expandedChatIds, filenames, importsRegistry, processCsvAtom, selectedChat } from "~/state/client";
import { Main } from "~/style";

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

const Message = styled.article<{ role: string }>(({ role }) => {
  const styles: SerializedStyles[] = [
    css`
      border-left: 4px solid transparent;
    `,
  ];
  if (role === "system") {
    styles.push(css`
      border-color: lightyellow;
    `);
  }
  if (role === "user") {
    styles.push(css`
      border-color: rebeccapurple;
    `);
  }
  if (role === "assistant") {
    styles.push(css`
      border-color: lightblue;
    `);
  }
  return styles;
});

function Imports() {
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
          <Message key={idx} role={message.role}>
            <header>{message.role}</header>
            {message.content && (
              <p
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(parse(message.content, { async: false })),
                }}
              />
            )}
          </Message>
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

export default function () {
  const sidebar = useSidebar();
  return (
    <>
      <Imports />
      {sidebar && createPortal(<Sidebar />, sidebar)}
    </>
  );
}
