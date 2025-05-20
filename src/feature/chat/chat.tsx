import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Clock } from "lucide-react";
import { DateTime } from "luxon";
import { type CSSProperties, type ReactNode, memo, useEffect, useMemo, useRef, useState } from "react";
import { P, match } from "ts-pattern";

import { type Path, experimentLayoutAtom, layoutAtom, selectionAtom, templatesAtom } from "../../atoms/common";
import { identityAtom, isDarkModeAtom, timezoneAtom } from "../../atoms/store";
import type { Experiment, ExperimentWithMeta, Message, _Message } from "../../types";
import { deepEqual } from "../../utils";
import { useHandlers } from "../../utils/keyboard";
import { isRunningAtom } from "../inference/atoms";
import { modelLabels } from "../inference/types";
import { resetMessageAtom } from "../router/NewExperiment/NewExperiment";
import { useItemTransition } from "../transitionState";
import { View } from "../ui/view";
import { Banner, ChatContainer, Footer, Header, MessageComponent, getAlign } from "./style";

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

  const shouldAlignLeft = typeof message.content === "string" && message.content.length > 128;
  let innerContent: ReactNode;
  let contentType: string | undefined;
  const align = getAlign(message.fromServer ?? false, experimentLayout);
  const viewStyle = {
    display: "flex",
    flexDirection: "column",
    textAlign: shouldAlignLeft ? "left" : align,
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

  const userIdentity = useAtomValue(identityAtom);

  const header = match(message)
    .with({ role: "tool", fromServer: true }, () => "call")
    .with({ role: "tool" }, () => "function")
    .with(
      { role: P.union("user", "assistant"), name: P.string, pronouns: P.optional(P.string) },
      ({ role, name, pronouns }) => {
        if (role === "assistant" && name in modelLabels) return modelLabels[name as keyof typeof modelLabels];
        const thisIdentity = pronouns ? `${name} (${pronouns})` : name;
        if (userIdentity === thisIdentity) return name;
        return thisIdentity;
      },
    )
    .with({ name: P.string }, ({ name }) => name)
    .otherwise(({ role }) => role);

  return (
    <MessageComponent
      ref={ref}
      role={message.role}
      align={align}
      contentType={contentType}
      name={message.name}
      isSelected={isSelected}
      isDarkMode={isDarkMode}
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
      transitionState={transitionState}
      sideLabel={false}
    >
      <Header>{header}</Header>
      {innerContent}
      {message.timestamp && <Timestamp timestamp={message.timestamp} />}
    </MessageComponent>
  );
};

export function ChatPreview({
  experiment,
  collapseTemplates = false,
  empty = <Banner>∅</Banner>,
  paddingBottom,
}: {
  experiment: Experiment;
  collapseTemplates?: boolean;
  empty?: ReactNode;
  paddingBottom?: string;
}) {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  const [isRunning] = useAtom(isRunningAtom);
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

  const [selection, setSelection] = useAtom(selectionAtom);
  const resetMessage = useSetAtom(resetMessageAtom);
  useHandlers({
    c: (e) => {
      if (!e.metaKey || !selection.length) return;
      const selectedMessage = computedMessages[selection[0]];
      if (!selectedMessage) return;
      const text =
        typeof selectedMessage.content === "string" ? selectedMessage.content : JSON.stringify(selectedMessage.content);
      if (text) navigator.clipboard.writeText(text);
    },
    Escape: () => {
      setSelection([]);
      resetMessage();
    },
  });

  if (computedMessages.length === 0) {
    return empty;
  }
  return (
    <ChatContainer isDarkMode={isDarkMode} layout={layout} style={{ paddingBottom }}>
      {computedMessages.map?.(({ key, index, ...message }) => {
        return <ChatMessage collapseTemplates={collapseTemplates} key={key} message={message} index={index} />;
      })}
    </ChatContainer>
  );
}

const Timestamp = memo(function Timestamp(props: { timestamp: string }) {
  const timezone = useAtomValue(timezoneAtom);
  const date = DateTime.fromISO(props.timestamp, { zone: timezone });
  const timestamp = date.isValid ? date.toFormat("T D") : props.timestamp;
  return (
    <Footer title={props.timestamp}>
      <Clock size={10} />
      {timestamp}
    </Footer>
  );
});
