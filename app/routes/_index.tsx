import type { MetaFunction } from "@remix-run/node";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  expandedChatIds,
  filenames,
  importsRegistry,
  selectedChat,
} from "~/atoms";
import { Container, Main } from "~/style";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
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
          }}
        >
          Chat {idx + 1}
        </div>
      ))}
    </div>
  );
};

const Content = () => {
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
            <h4>{message.role}</h4>
            <p>{message.content}</p>
          </div>
        ))}
        <div>
          <h4>{chat.response.role}</h4>
          <p>{chat.response.content}</p>
        </div>
        {chat.response.tool_calls && (
          <>
            <h4>Tool Calls</h4>
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
};

export default function Index() {
  const [chats] = useAtom(filenames);
  const [expandedChats, setExpandedChatIds] = useAtom(expandedChatIds);
  return (
    <Container>
      <aside>
        <h2>🔬 Experiment</h2>
        <h3>Imports</h3>
        {chats.length > 0 ? (
          chats.map((chatId) => {
            const isExpanded = expandedChats.includes(chatId);
            return (
              <section key={chatId}>
                <h3
                  onClick={() => {
                    setExpandedChatIds((prev) =>
                      prev.includes(chatId)
                        ? prev.filter((id) => id !== chatId)
                        : [...prev, chatId]
                    );
                  }}
                >
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
      </aside>
      <Content />
    </Container>
  );
}
