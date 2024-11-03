import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatContainer, ChatPreview } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { experimentAtom, isDarkModeAtom, type Role } from "../state/common";
import inference from "../state/inference";
import { bs, Button } from "../style";
import { Palette } from "../style/palette";

const { runExperimentAsOpenAi, testStreaming } = inference;

const Column = styled.div`
  display: flex;
  flex-direction: column;

  ${ChatContainer} {
    flex: 1;
  }
`;

const Block = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(0.5)};
  position: sticky;
  bottom: 0;

  margin: ${bs(0.5)} -${bs(0.5)} 0;
  width: auto;

  backdrop-filter: blur(10px) brightness(${(p) => (p.isDarkMode ? 1.5 : 0.9)}) saturate(2);
  box-shadow: 0px 0px 2px 0px inset #ffffff78;

  & * {
    border-radius: 0;
    border: none;
    background: #ffffff4d;
  }

  textarea {
    padding: 0 ${bs(0.5)} ${bs(0.25)};
    resize: none;
    border-bottom-left-radius: ${bs(0.5)};
    border-bottom-right-radius: ${bs(0.5)};
    &:focus {
      outline: none;
    }
  }

  select {
    padding: 0 ${bs(0.5)};
    background: transparent;
  }
  button {
    background: transparent;
    color: inherit;
  }
  select,
  button {
    :hover {
      cursor: pointer;
      background: ${(p) => (p.isDarkMode ? "#f0f0f024" : "#fff9")};
    }
  }
`;

const ActionRow = styled.div`
  display: flex;
  border-top-left-radius: ${bs(0.5)};
  border-top-right-radius: ${bs(0.5)};
  select {
    border-top-left-radius: ${bs(0.5)};
  }
  button {
    border-top-right-radius: ${bs(0.5)};
  }
`;

export default function NewExperiment() {
  const navigate = useNavigate();
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");
  const submit = () => {
    setMessage("");
    setExperiment([...experiment, { role, content: message }]);
  };
  const [_, runExperiment] = useAtom(runExperimentAsOpenAi);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "inherit";
    // Set height
    textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 0), 192)}px`;
  }, [message]);
  return (
    <>
      <Column>
        <ChatPreview history={experiment} />

        <Block isDarkMode={isDarkMode}>
          <ActionRow>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ flex: 1 }}>
              <option>system</option>
              <option>user</option>
              <option>tool</option>
            </select>
            <button onClick={() => submit()}>add</button>
          </ActionRow>

          <textarea
            placeholder="Type a message to start experiment..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            autoFocus
            ref={textareaRef}
          />
        </Block>
      </Column>
      <aside>
        <h3>Actions</h3>
        <Button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            runExperiment();
          }}>
          new experiment
        </Button>
      </aside>
      <ExperimentsSidebar />
    </>
  );
}
