import { type SerializedStyles, css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue } from "jotai";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from "react";
import { TRIANGLE } from "../../const";
import { type Store, experimentLayoutAtom, isDarkModeAtom, templatesAtom } from "../../atoms/common";
import { isRunningAtom } from "../inference/atoms";
import { bs } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { deepEqual } from "../../utils";
import { useHandlers } from "../../utils/keyboard";
import { useScrollToTop } from "../../utils/scroll";
import { View, collapsedAtom } from "../ui/view";
import type { _Message, Experiment, ExperimentWithMeta, Message, Role } from "../../types";

const baseHeight = bs(6);
export const ChatContainer = styled.div<WithDarkMode>`
  flex: 1;
  display: flex;
  flex-direction: column-reverse;

  code {
    background-color: ${(p) => (p.isDarkMode ? Palette.white + "50" : Palette.black + "20")};
    border-radius: ${bs(Palette.borderSpan)};
  }

  *:not(pre) code {
    padding: 0 ${bs(1 / 10)};
  }

  pre {
    text-align: left;
  }

  a {
    color: ${(p) => (p.isDarkMode ? Palette.pink : Palette.pink)};
    text-decoration: underline;
    :hover {
      color: ${(p) => (p.isDarkMode ? Palette.purple : Palette.purple)};
    }
  }

  & > article {
    min-height: ${baseHeight};
    flex-shrink: 0;
  }
`;

const getAlign = (fromServer: boolean, experimentLayout: Store["experimentLayout"]) => {
  switch (experimentLayout) {
    case "left":
      return "left";
    case "chat-reverse":
      return fromServer ? "right" : "left";
    default:
      return fromServer ? "left" : "right";
  }
};

export const MessageComponent = styled.article<{
  role: Role;
  contentType?: string;
  ioType?: "input" | "output";
  isSelected?: boolean;
  isDarkMode?: boolean;
  experimentLayout: Store["experimentLayout"];
  name?: string;
}>(({ name, role, ioType, contentType, isSelected, isDarkMode, experimentLayout }) => {
  const fromServer = ioType === "output";
  const align = getAlign(fromServer, experimentLayout);
  const styles: SerializedStyles[] = [
    css`
      border-${align}: 4px solid transparent;
      position: relative;
      overflow: hidden;

      & > * {
        display: grid;
        padding: ${bs(1 / 2)};
        padding-${align}: ${bs(1.5)};
        word-wrap: break-word;
      }

      &:before {
        content: "${[contentType, name ?? role].filter(Boolean).join(` ${TRIANGLE} `)}";
        position: absolute;
        ${align}: 0;
        transform-origin: ${align};
        ${
          align === "right" ?
            css`
              transform: rotate(-90deg) translate(0, -20px);
            `
          : css`
              transform: rotate(270deg) translate(-100%, 16px);
            `
        }
      }

      li ul,
      li ol {
        padding-${align}: ${bs(1)};
      }

      hr {
        opacity: 0.2;
        color: ${isDarkMode ? Palette.white : Palette.black};
        margin-top: ${bs(0.15)};
        margin-bottom: ${bs(0.05)};
        border: 0;
        border-bottom: 1px solid currentColor;
      }

      pre > hr {
        margin-bottom: ${bs(1 / 4)}
      }
    `,
  ];
  if (align === "right" && contentType === "object") {
    styles.push(css`
      ol {
        padding-left: 0;
      }
    `);
  }
  if (role === "system") {
    styles.push(css`
      border-color: ${Palette.yellow};
    `);
  }
  if (role === "developer") {
    styles.push(css`
      border-color: ${Palette.blue};
    `);
  }
  if (role === "user") {
    styles.push(css`
      border-color: ${Palette.purple};
    `);
  }
  if (role === "assistant") {
    styles.push(css`
      border-color: ${Palette.pink};
    `);
  }
  if (role === "tool") {
    styles.push(css`
      border-color: ${Palette.green};
    `);
  }
  if (role === "info") {
    if (isDarkMode) {
      styles.push(css`
        border-color: ${Palette.white}70;
      `);
    } else {
      styles.push(css`
        border-color: ${Palette.black}50;
      `);
    }
  }
  if (role === "error") {
    styles.push(css`
      border-color: ${Palette.red};
    `);
  }
  if (role === "context") {
    styles.push(css`
      border-color: ${Palette.teal};
    `);
  }
  if (isSelected) {
    if (isDarkMode) {
      styles.push(css`
        background-color: ${Palette.white}30;
      `);
    } else {
      styles.push(css`
        background-color: #7d7d7d42;
      `);
    }
  }

  return styles;
});

export type Path = [number] | [number, "content"];
export const selectionAtom = atom<Path | null>(null);

function hasMessages(obj: _Message | ExperimentWithMeta): obj is ExperimentWithMeta {
  return Object.hasOwn(obj, "messages");
}

export type Coords = [x: number, y: number];

export const ChatMessage = ({ message: _message, index }: { message: Message; index: number }) => {
  const ref = useRef<null | HTMLElement>(null);
  const selector: Path = [index, "content"];
  const [selection, setSelection] = useAtom(selectionAtom);
  const isSelected = index === selection?.[0];
  const [collapsed, setCollapsed] = useAtom(collapsedAtom);
  const templates = useAtomValue(templatesAtom);
  const isDarkMode = useAtomValue(isDarkModeAtom);
  const experimentLayout = useAtomValue(experimentLayoutAtom);

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

  if (message.template) {
    contentType = "tmpl";
    innerContent ??= (
      <View
        onClick={(value, key, path) => {
          const fullPath = [...selector, ...path, key];
        }}
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
    // } else if (isSelected && selection?.[1] === "content") {
    //   const [{ height }] = ref.current?.getClientRects() ?? [{ height: baseHeight }];
    //   innerContent ??= (
    //     <Editor
    //       minHeight={height}
    //       setValue={(value) => {
    //         setter(value);
    //         setSelection(null);
    //       }}>
    //       {message.content}
    //     </Editor>
    //   );
  } else if (!message.content) {
    innerContent ??= (
      <div>
        <em>{"<Empty>"}</em>
      </div>
    );
  } else if (["string", "object"].includes(typeof message.content)) {
    innerContent ??= (
      <View
        onClick={(value, key, path) => {
          const fullPath = [...selector, ...path, key];
        }}
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

  return (
    <MessageComponent
      // contentEditable={isSelected && selection?.[1] === "content"}
      // onBlur={(e) => {
      //   setSelection([index]);
      // }}
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
        if (selection?.length === 2) return;
        if (isSelected) return;
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
    >
      {innerContent}
    </MessageComponent>
  );
};

const Banner = styled.div`
  display: grid;
  place-items: center;
  height: 100%;
  font-size: ${bs(2)};
`;

export function ChatPreview({
  experiment,
  autoScroll,
  autoScrollAnchor = "first",
}: {
  experiment: Experiment;
  autoScroll?: boolean;
  autoScrollAnchor?: "first" | "last";
}) {
  const [selection, setSelection] = useAtom(selectionAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isRunning] = useAtom(isRunningAtom);
  const computedMessages = useMemo(() => {
    const messages = Array.isArray(experiment) ? experiment : experiment.messages;
    const keyed = messages.map((message, index) => {
      return { ...message, key: index };
    });
    const reversed = [...keyed].reverse();
    if (isRunning && !reversed[0].fromServer) {
      reversed.unshift({ role: "assistant", content: "...", fromServer: true, key: -1 });
    }
    return reversed;
  }, [experiment, isRunning]);
  const Anchor = useScrollToTop("top", [computedMessages.length, autoScroll, autoScrollAnchor]);

  useHandlers({
    Escape: () => {
      setSelection(null);
    },
  });

  useEffect(() => {
    return () => void setSelection(null);
  }, []);

  if (computedMessages.length === 0) {
    return <Banner>∅</Banner>;
  }
  return (
    <ChatContainer isDarkMode={isDarkMode}>
      {autoScroll && autoScrollAnchor === "first" && <Anchor />}
      {computedMessages.map?.(({ key, ...message }) => {
        return <ChatMessage key={key} message={message} index={key} />;
      })}
      {autoScroll && autoScrollAnchor === "last" && <Anchor />}
    </ChatContainer>
  );
}
