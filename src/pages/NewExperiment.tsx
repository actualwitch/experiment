import { atom, useAtom, useSetAtom } from "jotai";
import { entangledAtom } from "../state/entanglement";
import { ChatContainer, ChatPreview, MessageComponent } from "../components/chat";
import { experimentAtom, experimentIdsAtom, newChatAtom, testStreaming, type Message, type Role } from "../state/common";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { SidebarInput } from "../navigation";
import { NavLink, useNavigate } from "react-router-dom";
import { ExperimentsSidebar } from "../sidebars/experiments";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  ${ChatContainer} {
    flex: 1;
  }
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActionRow = styled.div`
  display: flex;
`;

export default function NewExperiment() {
  const navigate = useNavigate();
  const [experiment, setExperiment] = useAtom(newChatAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");
  const submit = () => {
    setMessage("");
    setExperiment([...experiment, { role, content: message }]);
  };
  const [isMetaPressed, setIsMetaPressed] = useState(false);
  const [result, runExperiment] = useAtom(testStreaming);
  useEffect(() => {
    if (result) {
      navigate(`/experiment/${result.id}/${result.runId}`);
    }
  }, [result]);
  useEffect(() => {
    const listenerDown = (e: KeyboardEvent) => {
      if (e.key === "Meta") {
        setIsMetaPressed(true);
      }
    };
    const listenerUp = (e: KeyboardEvent) => {
      if (e.key === "Meta") {
        setIsMetaPressed(false);
      }
    };
    document.addEventListener("keydown", listenerDown);
    document.addEventListener("keyup", listenerUp);
    return () => {
      document.removeEventListener("keydown", listenerDown);
      document.removeEventListener("keyup", listenerUp);
    };
  }, []);
  return (
    <>
      <Column>
        <h1>Experiment</h1>
        <ChatPreview history={experiment} />

        <Block>
          <ActionRow>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ flex: 1 }}>
              <option>system</option>
              <option>user</option>
              <option>assistant</option>
              <option>tool</option>
            </select>
            <button onClick={() => submit()}>{isMetaPressed ? "send" : "add"}</button>
          </ActionRow>

          <textarea
            placeholder="Type a message to start experiment..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </Block>
      </Column>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            runExperiment()
          }}>
          new experiment
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
