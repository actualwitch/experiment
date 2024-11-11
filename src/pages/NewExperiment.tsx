import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { ChatPreview, selectionAtom } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { experimentAtom, isDarkModeAtom, type Role } from "../state/common";
import inference from "../state/inference";
import { bs, Button } from "../style";
import { useHandlers } from "../utils/keyboard";

const { runExperimentAsAnthropic, runExperimentAsOpenAi, testStreaming } = inference;

type Provider = "anthropic" | "openai" | "test";

const actionMap = {
  anthropic: runExperimentAsAnthropic,
  openai: runExperimentAsOpenAi,
  test: testStreaming,
} as const;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
`;

const Block = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(0.5)};
  position: sticky;
  bottom: 0;

  margin: ${bs(0.5)} -${bs(0.5)} 0;
  width: auto;

  backdrop-filter: blur(10px) brightness(${(p) => (p.isDarkMode ? 1.5 : 0.9)}) saturate(2);
  box-shadow: 0px 0px 2px 0px inset #ffffff78, 0px 2px 8px 1px #ffffff3f;

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

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "inherit";
    ref.current.style.height = `${Math.min(Math.max(ref.current.scrollHeight, 0), 192)}px`;
  }, [props.value]);
  return <textarea {...props} ref={ref} />;
};

export default function NewExperiment() {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [provider, setProvider] = useState<Provider>("anthropic");

  const [_, runExperiment] = useAtom(actionMap[provider]);
  const submit = () => {
    if (!message) return;
    setMessage("");
    setExperiment([...experiment, { role, content: message }]);
  };

  useHandlers({
    Backspace: () => {
      if (selection && selection.length === 1) {
        const newExperiment = experiment.filter((_, i) => i !== selection[0]);
        setExperiment(newExperiment);
        setSelection(null);
      }
    },
  });

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
          <TextArea
            placeholder="Type a message and press Enter to append..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            autoFocus
          />
        </Block>
      </Column>
      <Sidebar>
        <h3>Actions</h3>
        <select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
          <option>anthropic</option>
          <option>openai</option>
          {/* <option>test</option> */}
        </select>
        <Button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            runExperiment();
          }}>
          start experiment
        </Button>
      </Sidebar>
      <ExperimentsSidebar />
    </>
  );
}
