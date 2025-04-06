import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type Path, experimentLayoutAtom, layoutAtom, selectionAtom, templatesAtom } from "../../atoms/common";
import { isDarkModeAtom } from "../../atoms/store";
import type { Experiment, ExperimentWithMeta, Message, _Message } from "../../types";
import { deepEqual } from "../../utils";
import { useHandlers } from "../../utils/keyboard";
import { isRunningAtom } from "../inference/atoms";
import { resetMessageAtom } from "../router/NewExperiment/NewExperiment";
import { type TransitionState, useItemTransition, useListTransition } from "../transitionState";
import { View, collapsedAtom } from "../ui/view";
import { Banner, ChatContainer, getAlign, MessageComponent, Header } from "./style";
import { match, P } from "ts-pattern";

export function hasMessages(obj: _Message | ExperimentWithMeta): obj is ExperimentWithMeta {
  return Object.hasOwn(obj, "messages");
}

export type Coords = [x: number, y: number];

export const ChatMessage = ({
  message: _message,
  index,
  collapseTemplates = true,
}: {
  message: Message;
  index: number;
  collapseTemplates?: boolean;
}) => {
  const ref = useRef<null | HTMLElement>(null);
  const selector: Path = [index, "content"];
  const [selection, setSelection] = useAtom(selectionAtom);
  const isSelected = index === selection?.[0];
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const templates = useAtomValue(templatesAtom);
  const isDarkMode = useAtomValue(isDarkModeAtom);
  const experimentLayout = useAtomValue(experimentLayoutAtom);

  const { transitionState } = useItemTransition(true, ref);

  const message = { ..._message };
  for (const [name, template] of Object.entries(templates ?? {})) {
    if (hasMessages(template)) {
      template.messages;
    } else {
      if (message.role === template.role && deepEqual(message.content, template.content)) {
        message.template = name;
        break;
      }
    }
  }

  let innerContent: ReactNode;
  let contentType: string | undefined;
  const align = getAlign(message.fromServer ?? false, experimentLayout);
  const viewStyle = {
    float: align,
    textAlign: typeof message.content === "object" ? align : undefined,
    width: "initial",
  } satisfies CSSProperties;

  if (collapseTemplates && message.template) {
    contentType = "tmpl";
    innerContent ??= (
      <View
        // onClick={(value, key, path) => {
        //   const fullPath = [...selector, ...path, key];
        // }}
        onTitleClick={(value, key, path) => {
          setCollapsed((prev) => {
            const fullPath = path.join(".");
            const isCollapsed = collapsed.includes(fullPath);
            if (isCollapsed) {
              return prev.filter((path) => path !== fullPath);
            }
            return [...prev, fullPath];
          });
        }}
        shouldBeCollapsed={(path) => collapsed.includes(path.join("."))}
        style={viewStyle}
      >
        {{ name: message.template }}
      </View>
    );
  } else if (!message.content) {
    innerContent ??= (
      <div>
        <em>{"<Empty>"}</em>
      </div>
    );
  } else if (["string", "object"].includes(typeof message.content)) {
    innerContent ??= (
      <View
        // onClick={(value, key, path) => {
        //   const fullPath = [...selector, ...path, key];
        // }}
        onTitleClick={(value, key, path) => {
          setCollapsed((prev) => {
            const fullPath = path.join(".");
            const isCollapsed = collapsed.includes(fullPath);
            if (isCollapsed) {
              return prev.filter((path) => path !== fullPath);
            }
            return [...prev, fullPath];
          });
        }}
        shouldBeCollapsed={(path) => collapsed.includes(path.join("."))}
        style={viewStyle}
      >
        {message.content}
      </View>
    );
  }

  const hitRef = useRef<Coords | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const header = match([message.role, message.fromServer])
    .with(["tool", P.nullish], () => "function")
    .otherwise(([role]) => role);

  return (
    <MessageComponent
      ref={ref}
      role={message.role}
      contentType={contentType}
      name={message.name}
      isSelected={isSelected}
      isDarkMode={isDarkMode}
      experimentLayout={experimentLayout}
      onMouseDown={(e) => {
        hitRef.current = [e.screenX, e.screenY];
      }}
      onMouseUp={(e) => {
        if (
          selection?.length === 2 ||
          isSelected ||
          e.nativeEvent.target?.nodeName === "EM" ||
          e.nativeEvent.target?.nodeName === "BUTTON"
        )
          return;
        if (hitRef.current) {
          const [x, y] = hitRef.current;
          hitRef.current = null;
          const dist = Math.hypot(e.screenX - x, e.screenY - y);
          if (dist > 5) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
        setSelection([selector[0]]);
      }}
      onDoubleClick={() => {
        setSelection(selector);
      }}
      ioType={message.fromServer ? "output" : "input"}
      transitionState={transitionState}
      sideLabel={false}
    >
      <Header>{header}</Header>
      {innerContent}
    </MessageComponent>
  );
};

export function ChatPreview({
  experiment,
  collapseTemplates = false,
  empty = <Banner>∅</Banner>,
}: {
  experiment: Experiment;
  autoScroll?: boolean;
  autoScrollAnchor?: "first" | "last";
  collapseTemplates?: boolean;
  empty?: ReactNode;
}) {
  const [selection, setSelection] = useAtom(selectionAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  const [isRunning] = useAtom(isRunningAtom);
  const resetMessage = useSetAtom(resetMessageAtom);
  const computedMessages = useMemo(() => {
    const messages = Array.isArray(experiment) ? experiment : experiment.messages;
    const keyed = messages.map((message, index) => {
      return { ...message, key: `${index}-${message.role}`, index };
    });
    if (isRunning && !keyed[keyed.length - 1].fromServer) {
      keyed.push({
        role: "assistant",
        content: "...",
        fromServer: true,
        key: `${keyed.length}-assistant`,
        index: keyed.length,
      });
    }
    return keyed;
  }, [experiment, isRunning]);

  useHandlers({
    Escape: () => {
      setSelection([]);
      resetMessage();
    },
  });

  if (computedMessages.length === 0) {
    return empty;
  }
  return (
    <ChatContainer isDarkMode={isDarkMode} layout={layout}>
      {computedMessages.map?.(({ key, index, ...message }) => {
        return <ChatMessage collapseTemplates={collapseTemplates} key={key} message={message} index={index} />;
      })}
    </ChatContainer>
  );
}
