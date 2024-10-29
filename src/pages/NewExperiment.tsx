import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatContainer, ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { experimentAtom, type Role } from "../state/common";
import inference from "../state/inference";

const { runExperimentAsOpenAi } = inference;

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
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");
  const submit = () => {
    setMessage("");
    setExperiment([...experiment, { role, content: message }]);
  };
  const [_, runExperiment] = useAtom(runExperimentAsOpenAi);
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
            <button onClick={() => submit()}>add</button>
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
            runExperiment();
          }}>
          new experiment
        </button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
