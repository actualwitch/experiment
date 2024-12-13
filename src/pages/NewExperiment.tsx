import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Item } from "react-stately";

import { NavLink } from "react-router";
import { Select } from "../components/Select";
import { Slider } from "../components/Slider";
import { ChatPreview, selectionAtom } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import { type Role, experimentAtom, isDarkModeAtom, templatesAtom, tokensAtom } from "../state/common";
import {
  modelAtom,
  modelOptions,
  runExperimentAsAnthropic,
  runExperimentAsOpenAi,
  tempAtom,
  testStreaming,
} from "../state/inference";
import { Button, Sidebar, bs } from "../style";
import { withDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { useHandlers } from "../utils/keyboard";

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

export const Block = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(0.5)};
  position: sticky;
  bottom: 0;
  overflow: clip;

  margin: ${bs(0.5)} -${bs(0.5)} 0;
  width: auto;

  backdrop-filter: blur(10px) brightness(${(p) => (p.isDarkMode ? 1.5 : 0.9)}) saturate(2);
  box-shadow:
    0px 0px 2px 0px inset #ffffff78,
    0px 2px 8px 1px #ffffff3f;

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
      background: "#fff9";
    }
  }
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        select,
        textarea {
          text-shadow: 0 0 2px ${Palette.black}22;
        }
        button {
          :hover {
            background: "#f0f0f024";
          }
        }
      `,
    )}
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

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "inherit";
    ref.current.style.height = `${Math.min(Math.max(ref.current.scrollHeight, 0), 192)}px`;
  }, [props.value]);
  return <textarea {...props} ref={ref} />;
};

export function withIds<T extends string>(items: T[] | readonly T[]) {
  return items.map((name) => ({
    id: name,
    name,
  }));
}
export const providerTypes = ["anthropic", "mistral", "openai"] as const;
export type ProviderType = (typeof providerTypes)[number];
export const providers = withIds(providerTypes);
export const providerLabels = {
  anthropic: "Anthropic",
  mistral: "Mistral",
  openai: "OpenAI",
} satisfies { [K in ProviderType]: string };

const ModalContainer = styled.div`
  min-height: 80vh;
  min-width: 80vw;
`;

export default function NewExperiment() {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [tokens] = useAtom(tokensAtom);
  const tokenProviders = Object.keys(tokens) as ProviderType[];
  const providerOptions = withIds(tokenProviders);
  const [provider, setProvider] = useState<Provider | null>(tokenProviders[0] ?? null);
  const [templates, setTemplates] = useAtom(templatesAtom);
  const [temp, setTemp] = useAtom(tempAtom);
  const [model, setModel] = useAtom(modelAtom);

  const models = useMemo(() => {
    if (!provider) return [];
    return modelOptions[provider];
  }, [provider]);

  useEffect(() => {
    if (provider && !models.includes(model)) {
      setModel(models[0]);
    }
  }, [provider, models, model]);

  const [object, setObject] = useState<null | object>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const object = JSON.parse(message);
        if (object.type !== "function") throw new Error("Not a function");
        setObject(object);
        setRole("tool");
      } catch {
        setObject(null);
      }
    }, 100);
    return () => clearTimeout(id);
  }, [message]);

  const isEditing = selection?.length === 2 && selection[1] === "content";

  const isDisabled = role === "tool" && !object;

  const [_, runExperiment] = useAtom(actionMap[provider ?? "test"]);
  const submit = () => {
    if (isEditing) {
      // const newMessage: Message = { role, content: object || message, fromServer:  };
      setSelection(null);
      setExperiment(
        experiment.map((item, i) => {
          if (i === selection[0]) {
            return { role, content: object || message };
          }
          return item;
        }),
      );
    }
    if (!message) return;
    setMessage("");
    setExperiment([...experiment, { role, content: object || message }]);
  };

  const deleteSelection = () => {
    if (selection && selection.length === 1) {
      const newExperiment = experiment.filter((_, i) => i !== selection[0]);
      setExperiment(newExperiment);
      setSelection(null);
    }
  };

  useHandlers({
    Backspace: deleteSelection,
  });

  useEffect(() => {
    if (isEditing) {
      const { content, role } = experiment[selection[0]];
      if (typeof content === "string") {
        setMessage(content);
        setRole(role);
      } else if (typeof content === "object") {
        setMessage(JSON.stringify(content, null, 2));
        setRole("tool");
      }
    } else {
      setMessage("");
      setRole("user");
    }
  }, [experiment, selection, isEditing]);
  if (providerOptions.length === 0) {
    return (
      <Column>
        <h2>Welcome to Experiment</h2>
        <p>
          To start inference, add a token on <NavLink to="/parameters">Parameters</NavLink> page. You can also explore a
          .csv file on the <NavLink to="/import">Import</NavLink> page.
        </p>
      </Column>
    );
  }
  return (
    <>
      <Column>
        <ChatPreview history={experiment} autoScroll />
        <Block isDarkMode={isDarkMode}>
          <ActionRow>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ flex: 1 }}>
              <option>system</option>
              <option>user</option>
              <option>tool</option>
            </select>
            <button type="button" disabled={isDisabled} onClick={() => submit()}>
              {isEditing ? "update" : "add"}
            </button>
          </ActionRow>
          <TextArea
            placeholder={`${role === "tool" ? "Paste JSONSchema" : "Type a message and press Enter to append"}…`}
            value={message}
            spellCheck={object === null}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (!isDisabled && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              try {
                const object = JSON.parse(text);
                if (object.type !== "function") return;
                setRole("tool");
                setMessage(text);
              } catch {}
            }}
            autoFocus
          />
        </Block>
      </Column>
      <Sidebar>
        <h3>Actions</h3>
        {tokenProviders.length > 1 && (
          <Select
            label="Provider"
            items={providerOptions}
            selectedKey={provider}
            onSelectionChange={(provider) => {
              setProvider(provider);
            }}
          >
            {(item) => (
              <Item textValue={item.name}>
                <div>{item.name}</div>
              </Item>
            )}
          </Select>
        )}
        <Select
          label="Model"
          items={withIds(models)}
          selectedKey={model}
          onSelectionChange={(model) => {
            setModel(model);
          }}
        >
          {(item) => (
            <Item textValue={item.name}>
              <div>{item.name}</div>
            </Item>
          )}
        </Select>
        <Slider
          value={temp}
          onChange={(value: number) => setTemp(value)}
          label="Temperature"
          minValue={0}
          maxValue={1}
          step={0.01}
          formatOptions={{ minimumFractionDigits: 2 }}
        />
        <Button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            runExperiment();
          }}
        >
          start experiment
        </Button>
        {selection !== null && selection.length === 1 && (
          <>
            <h4>This message</h4>
            <div>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  setSelection([selection[0], "content"]);
                }}
              >
                edit
              </Button>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  deleteSelection();
                }}
              >
                delete
              </Button>
              <Button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  const name = prompt("Name of the template");
                  if (!name) return;
                  setTemplates({ ...templates, [name]: experiment[selection[0]] });
                }}
              >
                template
              </Button>
            </div>
          </>
        )}
      </Sidebar>
      <ExperimentsSidebar />
    </>
  );
}
