import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { type Setter, atom, useAtom, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";

import { Disc3, MessageCircleDashed, Play, Pyramid, Rewind, Trash2 } from "lucide-react";
import {
  experimentAtom,
  isActionPanelOpenAtom,
  isDarkModeAtom,
  modelAtom,
  parentAtom,
  selectedProviderAtom,
  selectionAtom,
  templatesAtom,
} from "../../atoms/common";
import { personasAtom } from "../../atoms/persona";
import { pwdAtom } from "../../atoms/server";
import { name } from "../../const";
import { bs } from "../../style";
import { type WithDarkMode, withDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { type Message, PossibleObjectType, type Role, RoleOptions } from "../../types";
import { useHandlers } from "../../utils/keyboard";
import { hasBackend } from "../../utils/realm";
import { useScrollToBottomRef } from "../../utils/scroll";
import { ChatPreview } from "../chat/chat";
import {
  availableProviderOptionsAtom,
  effortAtom,
  isReasoningModelAtom,
  isRunningAtom,
  modelOptionsAtom,
  runInferenceAtom,
  tempAtom,
} from "../inference/atoms";
import { tryParseFunctionSchema } from "../inference/function";
import { modelOptions } from "../inference/types";
import { Actions } from "../ui/Actions";
import { type Config, ConfigRenderer } from "../ui/ConfigRenderer";
import { createCancelEditingButton, createSelectionEditButtons } from "../ui/ConfigRenderer/buttonCreators";
import { Page } from "../ui/Page";
import { TextArea } from "../ui/TextArea";

const baseMargin = 1 / 2;

export const inlineButtonModifier = css`
  background: transparent;
  color: inherit;
  padding-top: 0;
  padding-bottom: 0;
  :hover {
    background-color: ${Palette.black}20;
  }
`;

export const Block = styled.div<WithDarkMode>`
  display: flex;
  flex-direction: column;

  border-radius: ${bs(Palette.baseRadius)};
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
    border-bottom-left-radius: ${bs(Palette.baseRadius)};
    border-bottom-right-radius: ${bs(Palette.baseRadius)};
    &:focus {
      outline: none;
    }
  }

  select {
    padding: 0 ${bs(baseMargin)};
    background: transparent;
  }
  button {
    ${inlineButtonModifier}
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
  border-top-left-radius: ${bs(Palette.baseRadius)};
  border-top-right-radius: ${bs(Palette.baseRadius)};
  select {
    border-top-left-radius: ${bs(Palette.baseRadius)};
  }
  button {
    border-top-right-radius: ${bs(Palette.baseRadius)};
  }
`;

export const Underline = styled.span`
  text-decoration: underline;
`;

export const actionsAtom = atom((get) => {
  const providerOptions = get(availableProviderOptionsAtom);
  const modelOptions = get(modelOptionsAtom);
  const isReasoningModel = get(isReasoningModelAtom);
  const isRunning = get(isRunningAtom);
  const experiment = get(experimentAtom);
  const selection = get(selectionAtom);
  const templates = get(templatesAtom);
  const personas = get(personasAtom);
  let counter = 0;
  const config: Config = {
    Actions: [],
  };
  if (providerOptions.length === 0 || modelOptions.length === 0) {
    return { config, counter };
  }
  if (providerOptions.length > 1) {
    config.Actions.push({
      type: "select",
      label: "Provider",
      atom: selectedProviderAtom,
      options: providerOptions,
    });
    counter++;
  }
  if (modelOptions.length > 1) {
    config.Actions.push({
      type: "select",
      label: "Model",
      atom: modelAtom,
      options: modelOptions,
    });
    counter++;
  }
  if (isReasoningModel) {
    config.Actions.push({
      type: "select",
      label: "Effort",
      atom: effortAtom,
      options: [
        { id: "low", name: "Low" },
        { id: "medium", name: "Medium" },
        // just like me fr fr
        { id: "high", name: "High" },
      ],
    });
    counter += 1;
  } else {
    config.Actions.push({
      type: "number",
      label: "Temperature",
      atom: tempAtom,
    });
    counter += 1;
  }
  // if (personas && Object.keys(personas).length > 0) {
  //   config.Actions.push({
  //     label: "Persona",
  //     atom: activePersonaAtom,
  //     options: Object.entries(personas).map(([id, persona]) => ({
  //       id,
  //       name: persona.role,
  //     })),
  //   });
  // }
  {
    config.Actions.push({
      buttons: [
        {
          label: "Start Experiment",
          icon: Play,
          action: (set: Setter) => set(runInferenceAtom),
          disabled: isRunning || experiment.length === 0,
        },
        {
          label: "Reset",
          icon: Rewind,
          action: (set: Setter) => {
            set(experimentAtom, []);
            set(parentAtom, undefined);
            set(selectionAtom, []);
          },
          disabled: isRunning || experiment.length === 0,
        },
      ],
    });
    counter += 2;
  }
  if (selection.length === 0 && experiment.length) {
    config.Actions.push({
      Experiment: {
        buttons: [
          {
            label: "Template",
            icon: Disc3,
            action: async (set: Setter) => {
              const name = prompt("Name of the template");
              if (!name) return;
              set(templatesAtom, { ...templates, [name]: { messages: experiment } });
            },
          },
        ],
      },
    });
    counter++;
  } else if (selection.length === 1) {
    config.Actions.push({
      Selection: {
        buttons: [
          {
            label: "Edit",
            icon: MessageCircleDashed,
            action: (set: Setter) => set(selectionAtom, [selection[0], "content"]),
          },
          {
            label: "Delete",
            icon: Trash2,
            action: (set: Setter) =>
              set(
                experimentAtom,
                get(experimentAtom).filter((_, i) => i !== selection[0]),
              ),
          },
          ...createSelectionEditButtons(templates, experiment[selection[0]]),
        ],
      },
    });
    counter += 3;
  } else if (selection.length === 2) {
    config.Actions.push({
      Editing: {
        buttons: [createCancelEditingButton([selection[0]])],
      },
    });
    counter++;
  }
  if (hasBackend()) {
    config.Actions.push({
      Special: {
        buttons: [
          {
            label: "Context",
            icon: Pyramid,
            action: (set: Setter) => {
              const dir = get(pwdAtom);
              if (dir) {
                set(experimentAtom, [...experiment, { role: "context", content: { directory: dir } }]);
              }
            },
          },
        ],
      },
    });
    counter++;
  }
  return { config, counter };
});

const messageAtom = atom("");

export default function () {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useAtom(messageAtom);
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
    if (provider && model && !models.includes(model)) {
      setModel(models[0]);
    }
  }, [provider, models, model]);

  const isEditing = selection?.length === 2 && selection[1] === "content";

  const isFocusedRef = useRef(false);

  const deleteSelection = () => {
    if (!isFocusedRef.current && selection && selection.length === 1) {
      const newExperiment = experiment.filter((_, i) => i !== selection[0]);
      setExperiment(newExperiment);
      setSelection([]);
    }
  };

  useHandlers({
    Backspace: deleteSelection,
  });

  useEffect(() => {
    if (isEditing) {
      try {
        const { content, role } = experiment[selection[0]];
        const textContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);
        setMessage(textContent);
        setRole(role);
      } catch {}
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
      setSelection([]);
    }
  }, [experiment, selection]);

  const [{ config: actions, counter }] = useAtom(actionsAtom);
  const startExperiment = useSetAtom(runInferenceAtom);

  const setIsActionPanelOpen = useSetAtom(isActionPanelOpenAtom);
  useEffect(() => {
    setIsActionPanelOpen(false);
  }, [experiment, isRunning, isEditing, selection]);

  const submit = () => {
    let object: object | undefined;
    try {
      object = JSON.parse(message);
    } catch {}
    if (isEditing) {
      setSelection([]);
      setExperiment(
        experiment.map((item, i) => {
          if (i === selection[0]) {
            const newMessage: Message = { role, content: object || message, fromServer: item.fromServer };
            return newMessage;
          }
          return item;
        }),
      );
      setMessage("");
      setRole("user");
      return;
    }
    if (object && PossibleObjectType.guard(role)) {
      setExperiment([...experiment, { role, content: object }]);
      setMessage("");
      setRole("user");
      return;
    }
    if (message) {
      setExperiment([...experiment, { role, content: message }]);
      setMessage("");
      setRole("user");
      return;
    }
    if (experiment.length) {
      startExperiment();
    }
  };

  const isDisabled = false;

  const pageRef = useScrollToBottomRef([experiment.length]);

  const page =
    providerOptions.length === 0 ?
      <Page>
        <h2>
          Welcome to <Underline>{name}</Underline>
        </h2>
        <p>
          To start inference, add a token on <NavLink to="/parameters">Parameters</NavLink> page. You can also explore a
          .csv file on the <NavLink to="/import">Import</NavLink> page.
        </p>
      </Page>
    : <Page ref={pageRef}>
        <ChatPreview experiment={experiment} autoScroll />
        <Block isDarkMode={isDarkMode}>
          <ActionRow>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ flex: 1 }}>
              {RoleOptions.alternatives.map((role) => {
                const text = role.value;
                return <option key={text}>{text}</option>;
              })}
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
            spellCheck={role === "tool"}
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
                if (Array.isArray(object)) {
                  e.preventDefault();
                  e.stopPropagation();
                  setExperiment([...experiment, ...object]);
                  return;
                }
                const parsed = tryParseFunctionSchema(object);
                if (parsed.isJust) {
                  e.preventDefault();
                  e.stopPropagation();
                  setExperiment([...experiment, { role: "tool", content: parsed.value }]);
                  return;
                }
                setRole("context");
              } catch {}
            }}
            autoFocus
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
            }}
          />
        </Block>
      </Page>;

  return (
    <>
      {page}
      {counter ?
        <Actions>
          <ConfigRenderer>{actions}</ConfigRenderer>
        </Actions>
      : null}
    </>
  );
}
