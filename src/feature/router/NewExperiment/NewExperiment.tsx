import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { type Setter, atom, useAtom, useSetAtom } from "jotai";
import { Disc3, MessageCircleDashed, Play, Pyramid, Rewind, SendHorizonal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isActionPanelOpenAtom,
  isNavPanelOpenAtom,
  layoutAtom,
  selectionAtom,
  type LayoutType,
} from "../../../atoms/common";
import { experimentAtom } from "../../../atoms/experiment";
import { personasAtom } from "../../../atoms/persona";
import { pwdAtom } from "../../../atoms/server";
import {
  isDarkModeAtom,
  isOnboardedAtom,
  modelAtom,
  nameAtom,
  parentAtom,
  pronounsAtom,
  selectedProviderAtom,
  templatesAtom,
} from "../../../atoms/store";
import { bs, sidebarWidth } from "../../../style";
import { type WithDarkMode, withDarkMode } from "../../../style/darkMode";
import { Palette } from "../../../style/palette";
import { type Message, PossibleObjectType, type Role, RoleOptions } from "../../../types";
import { useHandlers } from "../../../utils/keyboard";
import { hasBackend } from "../../../utils/realm";
import { ChatPreview } from "../../chat/chat";
import {
  availableProviderOptionsAtom,
  effortAtom,
  isReasoningEffortSupportedAtom,
  isReasoningModelAtom,
  isRunningAtom,
  modelOptionsAtom,
  runInferenceAtom,
  tempAtom,
} from "../../inference/atoms";
import { tryParseFunctionSchema } from "../../inference/function";
import { modelOptions } from "../../inference/types";
import type { Config } from "../../ui/ConfigRenderer";
import { createCancelEditingButton, createSelectionEditButtons } from "../../ui/ConfigRenderer/buttonCreators";
import { Page } from "../../ui/Page";
import { TextArea } from "../../ui/TextArea";
import { inlineButtonModifier } from "./style";
import { Onboarding } from "./Onboarding";
import { withOnMobile } from "../../../style/layout";
import { DEBUG } from "../../../const/dynamic";

const baseMargin = 1 / 2;

export const Block = styled.div<WithDarkMode & { isHidden: boolean; layout?: LayoutType }>`
  background: #0000001f;
  border-radius: ${bs(Palette.baseRadius)};
  position: absolute;
  bottom: ${bs()};
  left: calc(${sidebarWidth} - ${bs(baseMargin)});
  right: calc(${sidebarWidth} - ${bs(baseMargin)});
  overflow: clip;

  ${(p) =>
    withOnMobile(
      p.layout,
      css`
        left: ${bs(baseMargin)};
        right: ${bs(baseMargin)};
      `,
    )}
  backdrop-filter: blur(10px) brightness(1.05) contrast(1.1) saturate(3);
  box-shadow:
    0px 0px 2px 0px inset #ffffff78,
    0px 2px 8px 1px #ffffff3f;

  transition: 100ms ease-out;
  transform: translateY(0);

  & * {
    border-radius: 0;
    border: none;
  }

  textarea {
    background: transparent;
    width: 100%;
    padding: 0 16px ${bs(baseMargin)};
    resize: none;
    transition: height 100ms ease-in-out;
    border-bottom-left-radius: ${bs(Palette.baseRadius)};
    border-bottom-right-radius: ${bs(Palette.baseRadius)};
    mask: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0) 0%,
      rgb(255, 255, 255) 4%,
      rgb(255, 255, 255) 96%,
      rgba(255, 255, 255, 0) 100%
    );
    padding-top: 8px;
    &:focus {
      outline: none;
    }
  }
  button {
    ${inlineButtonModifier}
  }
  select,
  button {
    margin: 12px 12px 0;
    padding: 2px 6px;
    line-height: 1;
    border-radius: 6px;
    text-shadow: none;
    background: transparent;
    :hover {
      cursor: pointer;
    }
  }
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        background: #ffffff33;
        backdrop-filter: blur(14px) brightness(1.7) saturate(3);
        select,
        textarea {
          text-shadow: 0 0 2px ${Palette.black}22;
        }
        button,
        select {
          :hover {
            background-color: ${Palette.white}20;
          }
        }
      `,
    )}
  ${(p) => p.isHidden && "transform: translateY(200px);"}
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-top-left-radius: ${bs(Palette.baseRadius)};
  border-top-right-radius: ${bs(Palette.baseRadius)};
`;

export const actionsAtom = atom((get) => {
  let counter = 0;
  const config: Config = {
    Actions: [],
  };

  const providerOptions = get(availableProviderOptionsAtom);
  const modelOptions = get(modelOptionsAtom);
  const isReasoningModel = get(isReasoningModelAtom);
  const isRunning = get(isRunningAtom);
  const experiment = get(experimentAtom);
  const selection = get(selectionAtom);
  const templates = get(templatesAtom);
  const personas = get(personasAtom);
  if (!get(isOnboardedAtom) || providerOptions.length === 0) {
    return { config, counter };
  }
  if (providerOptions.length > 0) {
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
  if (!isReasoningModel) {
    config.Actions.push({
      type: "number",
      label: "Temperature",
      atom: tempAtom,
    });
    counter += 1;
  } else if (get(isReasoningEffortSupportedAtom)) {
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
            set(resetMessageAtom);
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

export const messageAtom = atom("");
export const roleAtom = atom<Role>("user");
export const resetMessageAtom = atom(null, (_, set) => {
  set(messageAtom, "");
  set(roleAtom, "user");
});

export function tryThis(callback: () => void): void {
  try {
    callback();
  } catch (e) {
    if (DEBUG) {
      console.error(e);
    }
  }
}

const TEXTAREA_HEIGHT = 68;

export default function () {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  const [experiment, setExperiment] = useAtom(experimentAtom);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [message, setMessage] = useAtom(messageAtom);
  const [role, setRole] = useAtom(roleAtom);
  const resetMessage = useSetAtom(resetMessageAtom);

  const [provider, setProvider] = useAtom(selectedProviderAtom);
  const [model, setModel] = useAtom(modelAtom);

  const [isRunning] = useAtom(isRunningAtom);

  const models = useMemo(() => {
    if (!provider) return [];
    return modelOptions[provider];
  }, [provider]);

  useEffect(() => {
    if (provider && model && !models.includes(model)) {
      setModel(undefined);
    }
  }, [provider, model, models]);

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
    z: (e) => {
      if (!e.metaKey) return;
      undoBuffer.pop()?.();
    },
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

  const startExperiment = useSetAtom(runInferenceAtom);

  const [isNavPanelOpen] = useAtom(isNavPanelOpenAtom);
  const [isActionPanelOpen, setIsActionPanelOpen] = useAtom(isActionPanelOpenAtom);
  useEffect(() => {
    setIsActionPanelOpen(false);
  }, [experiment, isRunning, isEditing, selection]);

  const [name] = useAtom(nameAtom);
  const [pronouns] = useAtom(pronounsAtom);

  const [undoBuffer, setUndoBuffer] = useState<Array<() => void>>([]);

  const submit = () => {
    let object: object | undefined;
    tryThis(() => {
      object = JSON.parse(message);
    });
    if (isEditing) {
      setSelection([]);
      setExperiment(
        experiment.map((item, i) => {
          if (i === selection[0]) {
            const newMessage: Message = {
              ...item,
              role,
              content: object || message,
            };
            return newMessage;
          }
          return item;
        }),
      );
      resetMessage();
      return;
    }
    const identity = role === "user" ? { name, pronouns } : {};
    const timestamp = new Date().toISOString();
    if (object && PossibleObjectType.guard(role)) {
      setExperiment([...experiment, { ...identity, role, content: object, timestamp }]);
      resetMessage();
      return;
    }
    if (message) {
      setExperiment([
        ...experiment,
        { ...identity, role, content: message, timestamp, fromServer: role === "assistant" },
      ]);
      resetMessage();
      if (role === "user") startExperiment();
      return;
    }
    if (experiment.length) {
      startExperiment();
    }
  };

  const isDisabled = false;

  const pageRef = useRef<HTMLDivElement | null>(null);

  const scrollToEnd = useCallback(() => {
    pageRef.current?.scrollTo({
      top: pageRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [experiment]);

  useEffect(() => {
    scrollToEnd();
  }, []);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(TEXTAREA_HEIGHT);

  useEffect(() => {
    if (!textAreaRef.current) return;
    if (message) {
      const contentScrollHeight = textAreaRef.current.scrollHeight;
      const docHeight = document.documentElement.clientHeight;
      const plannedHeight = Math.min(Math.max(contentScrollHeight, 0), Math.floor(docHeight / 2));
      setTextareaHeight(plannedHeight);
    } else {
      setTextareaHeight(TEXTAREA_HEIGHT);
    }
  }, [message]);

  const [isOnboarded] = useAtom(isOnboardedAtom);

  if (!isOnboarded) {
    return (
      <Page>
        <Onboarding />
      </Page>
    );
  }

  return (
    <>
      <Page ref={pageRef}>
        <ChatPreview experiment={experiment} paddingBottom={`calc(64px + ${textareaHeight}px)`} />
      </Page>
      <Block isDarkMode={isDarkMode} isHidden={isNavPanelOpen || isActionPanelOpen} layout={layout}>
        <ActionRow>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value={"system"}>System:</option>
            <option value={"user"}>{name || "User"}:</option>
            <option value={"assistant"}>Assistant:</option>
            <option value={"tool"}>Function:</option>
          </select>
          {isEditing ? (
            <button type="button" disabled={isDisabled} onClick={submit}>
              Save
            </button>
          ) : null}
          {!isEditing && message ? (
            <button type="button" disabled={isDisabled} onClick={submit}>
              Send
            </button>
          ) : null}
        </ActionRow>
        <textarea
          ref={textAreaRef}
          placeholder={`${role === "tool" ? "Paste JSONSchema" : "Type a message and press Enter to append"}…`}
          value={message}
          spellCheck={role !== "tool"}
          style={{ height: textareaHeight }}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (!isDisabled && e.key === "Enter" && !e.shiftKey && layout !== "mobile") {
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
                setUndoBuffer([
                  ...undoBuffer,
                  () => {
                    setExperiment(experiment);
                    setMessage(text);
                  },
                ]);
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
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
          }}
        />
      </Block>
    </>
  );
}
