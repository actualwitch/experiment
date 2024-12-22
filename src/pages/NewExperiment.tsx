import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { type Setter, atom, useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";

import { type Config, ConfigRenderer } from "../components/ConfigRenderer";
import { ChatPreview, selectionAtom } from "../components/chat";
import { ExperimentsSidebar } from "../sidebars/experiments";
import {
  type Message,
  type Role,
  experimentAtom,
  isDarkModeAtom,
  layoutAtom,
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
import { Sidebar, bs } from "../style";
import { type WithDarkMode, withDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { increaseSpecificity } from "../style/utils";
import { useHandlers } from "../utils/keyboard";

export const Column = styled.div<WithDarkMode>`
  display: flex;
  flex-direction: column;
  ${increaseSpecificity()} {
    overflow-x: hidden;
  }
  a {
    color: ${(p) => (p.isDarkMode ? Palette.pink : Palette.pink)};
    text-decoration: underline;
    cursor: pointer;
    :hover {
      color: ${(p) => (p.isDarkMode ? Palette.purple : Palette.purple)};
    }
  }
`;

export const Block = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(0.5)};
  position: sticky;
  bottom: 0;
  overflow: clip;
  flex-shrink: 0;

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
  const [layout] = useAtom(layoutAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [providerOptions] = useAtom(availableProviderOptionsAtom);
  const [provider, setProvider] = useAtom(selectedProviderAtom);

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

  if (providerOptions.length === 0) {
    return (
      <Column isDarkMode={isDarkMode}>
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
      <Column isDarkMode={isDarkMode}>
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
      {layout === "desktop" && (
        <Sidebar>
          <ConfigRenderer>{actions}</ConfigRenderer>
        </Sidebar>
      )}
      <ExperimentsSidebar />
    </>
  );
}
