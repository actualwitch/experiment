import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { type Setter, atom, useAtom, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";

import { type Config, ConfigRenderer } from "../components/ConfigRenderer";
import { ChatPreview, selectionAtom } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import {
  type Message,
  type Role,
  experimentAtom,
  isActionPanelOpenAtom,
  isDarkModeAtom,
  parentAtom,
  templatesAtom,
} from "../state/common";
import {
  availableProviderOptionsAtom,
  isRunningAtom,
  modelAtom,
  modelOptions,
  modelOptionsAtom,
  modelSupportsTemperatureAtom,
  runInferenceAtom,
  selectedProviderAtom,
  tempAtom,
} from "../state/inference";
import { bs } from "../style";
import { withDarkMode, type WithDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { useHandlers } from "../utils/keyboard";
import { Actions, Page } from "./_page";

const baseRadius = 3 / 4;
const baseMargin = 1 / 2;

export const Block = styled.div<WithDarkMode>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(baseRadius)};
  position: sticky;
  bottom: 0;
  overflow: clip;
  flex-shrink: 0;

  margin: ${bs(baseMargin)} -${bs(baseMargin)} 0;
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
    padding: 0 ${bs(baseMargin)} ${bs(baseMargin)};
    resize: none;
    border-bottom-left-radius: ${bs(baseRadius)};
    border-bottom-right-radius: ${bs(baseRadius)};
    &:focus {
      outline: none;
    }
  }

  select {
    padding: 0 ${bs(baseMargin)};
    background: transparent;
  }
  button {
    background: transparent;
    color: inherit;
    padding-top: 0;
    padding-bottom: 0;
    :hover {
      background-color: ${Palette.black}20;
    }
  }
  select,
  button {
    padding-top: ${bs(baseMargin / 2)};
    padding-bottom: ${bs(baseMargin / 2)};
    :hover {
      cursor: pointer;
      background: #fff9;
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
            background-color: ${Palette.white}20;
          }
        }
      `,
    )}
`;

const ActionRow = styled.div`
  display: flex;
  border-top-left-radius: ${bs(baseRadius)};
  border-top-right-radius: ${bs(baseRadius)};
  select {
    border-top-left-radius: ${bs(baseRadius)};
  }
  button {
    border-top-right-radius: ${bs(baseRadius)};
  }
`;

const actionsAtom = atom((get) => {
  const providerOptions = get(availableProviderOptionsAtom);
  const modelOptions = get(modelOptionsAtom);
  const supportsTemp = get(modelSupportsTemperatureAtom);
  const isRunning = get(isRunningAtom);
  const experiment = get(experimentAtom);
  const selection = get(selectionAtom);
  const config: Config = {
    Actions: [
      providerOptions.length > 1 && {
        label: "Provider",
        atom: selectedProviderAtom,
        options: providerOptions,
      },
      {
        label: "Model",
        atom: modelAtom,
        options: modelOptions,
      },
      supportsTemp && {
        label: "Temperature",
        atom: tempAtom,
      },
      {
        buttons: [
          {
            label: "Start Experiment",
            action: (set: Setter) => set(runInferenceAtom),
            disabled: isRunning || experiment.length === 0,
          },
          {
            label: "Reset",
            action: (set: Setter) => set(experimentAtom, []),
            disabled: isRunning || experiment.length === 0,
          },
        ],
      },
      (selection !== null &&
        selection.length === 1 && {
          Selection: {
            buttons: [
              {
                label: "Edit",
                action: (set: Setter) => set(selectionAtom, [selection[0], "content"]),
              },
              {
                label: "Delete",
                action: (set: Setter) =>
                  set(
                    experimentAtom,
                    get(experimentAtom).filter((_, i) => i !== selection[0]),
                  ),
              },
              {
                label: "Template",
                action: async (set: Setter) => {
                  const name = prompt("Name of the template");
                  if (!name) return;
                  set(templatesAtom, { ...get(templatesAtom), [name]: get(experimentAtom)[selection[0]] });
                },
              },
            ],
          },
        }) ||
        (selection?.length === 2 && {
          Selection: {
            buttons: [
              {
                label: "Cancel",
                action: (set: Setter) => set(selectionAtom, [selection[0]]),
              },
            ],
          },
        }),
    ],
  };
  return config;
});

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "inherit";
    if (props.value) {
      const docHeight = document.documentElement.clientHeight;
      const contentScrollHeight = ref.current.scrollHeight;
      const plannedHeight = Math.min(Math.max(contentScrollHeight, 0), Math.floor(docHeight / 2));
      ref.current.style.height = `${plannedHeight}px`;
    }
  }, [props.value]);
  return <textarea {...props} ref={ref} />;
};

export default function NewExperiment() {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [providerOptions] = useAtom(availableProviderOptionsAtom);
  const [provider, setProvider] = useAtom(selectedProviderAtom);

  const [isRunning] = useAtom(isRunningAtom);

  useEffect(() => {
    if (!provider && providerOptions.length > 0) {
      setProvider(providerOptions[0].id);
    }
  }, [provider, providerOptions]);

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
      try {
        const { content, role } = experiment[selection[0]];
        if (typeof content === "string") {
          setMessage(content);
          setRole(role);
        } else if (typeof content === "object") {
          setMessage(JSON.stringify(content, null, 2));
          setRole("tool");
        }
      } catch {}
    } else {
      setMessage("");
      setRole("user");
    }
  }, [experiment, selection, isEditing]);

  const [parent, setParent] = useAtom(parentAtom);

  useEffect(() => {
    if (parent && experiment.length === 0) {
      setParent(undefined);
    }
  }, [experiment, parent]);

  useEffect(() => {
    if (selection && selection[0] >= experiment.length) {
      setSelection(null);
    }
  }, [experiment, selection]);

  const [actions] = useAtom(actionsAtom);
  const startExperiment = useSetAtom(runInferenceAtom);

  const setIsActionPanelOpen = useSetAtom(isActionPanelOpenAtom);
  useEffect(() => {
    setIsActionPanelOpen(false);
  }, [experiment, isRunning, isEditing, selection]);

  const submit = () => {
    if (isEditing) {
      setSelection(null);
      setExperiment(
        experiment.map((item, i) => {
          if (i === selection[0]) {
            const newMessage: Message = { role, content: object || message, fromServer: item.fromServer };
            return newMessage;
          }
          return item;
        }),
      );
      return;
    }
    if (message) {
      setMessage("");
      setExperiment([...experiment, { role, content: object || message }]);
      return;
    }
    if (experiment.length) {
      startExperiment();
    }
  };

  if (providerOptions.length === 0) {
    return (
      <Page>
        <h2>Welcome to Experiment</h2>
        <p>
          To start inference, add a token on <NavLink to="/parameters">Parameters</NavLink> page. You can also explore a
          .csv file on the <NavLink to="/import">Import</NavLink> page.
        </p>
      </Page>
    );
  }
  return (
    <>
      <Page>
        <ChatPreview messages={experiment} autoScroll />
        <Block isDarkMode={isDarkMode}>
          <ActionRow>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ flex: 1 }}>
              <option>system</option>
              <option>user</option>
              <option>tool</option>
            </select>
            {isEditing ?
              <button type="button" disabled={isDisabled} onClick={submit}>
                update
              </button>
            : null}
            {!isEditing && message ?
              <button type="button" disabled={isDisabled} onClick={submit}>
                add
              </button>
            : null}
            {!isEditing && !message && experiment.length ?
              <button type="button" disabled={isDisabled} onClick={submit}>
                start
              </button>
            : null}
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
      </Page>
      <Actions>
        <ConfigRenderer>{actions}</ConfigRenderer>
      </Actions>
      <ExperimentsSidebar />
    </>
  );
}
