import { type SerializedStyles, css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { TRIANGLE } from "../const";
import {
  type Message,
  type Store,
  type _Message,
  experimentAtom,
  experimentLayoutAtom,
  isDarkModeAtom,
  templatesAtom,
} from "../state/common";
import { bs } from "../style";
import type { WithDarkMode } from "../style/darkMode";
import { widthAvailable } from "../style/mixins";
import { Palette } from "../style/palette";
import { deepEqual } from "../utils";
import { useHandlers } from "../utils/keyboard";
import { useScrollToTop } from "../utils/scroll";
import { View, collapsedAtom } from "./view";

const baseHeight = bs(6);
export const ChatContainer = styled.div<WithDarkMode>`
  flex: 1;
  display: flex;
  flex-direction: column-reverse;

  code {
    padding: 0 ${bs(1 / 10)};
    background-color: ${(p) => (p.isDarkMode ? Palette.white + "50" : Palette.black + "20")};
    border-radius: ${bs(1 / 8)};
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
  role: "assistant" | "developer" | "info" | "system" | "tool" | "user";
  contentType?: string;
  ioType?: "input" | "output";
  isSelected?: boolean;
  isDarkMode?: boolean;
  experimentLayout: Store["experimentLayout"];
}>(({ role, ioType, contentType, isSelected, isDarkMode, experimentLayout }) => {
  const fromServer = ioType === "output";
  const align = getAlign(fromServer, experimentLayout);
  const styles: SerializedStyles[] = [
    css`
      border-${align}: 4px solid transparent;
      position: relative;
      overflow: hidden;
      text-align: ${align};

      & > * {
        display: block;
        padding: ${bs(1 / 2)};
        padding-${align}: ${bs(1.5)};
        word-wrap: break-word;
        ${widthAvailable}
      }

      &:before {
        content: "${[contentType, role].filter(Boolean).join(` ${TRIANGLE} `)}";
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

type Path = [number] | [number, "content"];
export const selectionAtom = atom<Path | null>(null);

const lensAtom = atom(
  (get) => {
    const selection = get(selectionAtom);
    if (selection === null) {
      return get(experimentAtom);
    }
    const [idx, key] = selection;
    const lens = focusAtom(experimentAtom, (o) => {
      if (key === "content") {
        return o.nth(idx).prop("content");
      }
      return o.nth(idx);
    });
    return get(lens);
  },
  (get, set, update: string | Message[] | ((prev: string | Message) => string | Message)) => {
    const selection = get(selectionAtom);
    if (selection === null) {
      set(experimentAtom, update as Message[]);
      return;
    }
    const lens = focusAtom(experimentAtom, (o) => {
      const [idx, key] = selection;
      if (key === "content") {
        return o.nth(idx).prop("content");
      }
      return o.nth(idx);
    });
    set(lens, update);
  },
);

function hasMessages(obj: _Message | { messages: Message[] }): obj is { messages: Message[] } {
  return Object.hasOwn(obj, "messages");
}

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
        style={{
          float: getAlign(message.fromServer ?? false, experimentLayout),
          width: "initial",
        }}
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
    contentType = typeof message.content;
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
        style={{
          float: getAlign(message.fromServer ?? false, experimentLayout),
          width: "initial",
        }}
      >
        {message.content}
      </View>
    );
  }

  return (
    <MessageComponent
      // contentEditable={isSelected && selection?.[1] === "content"}
      // onBlur={(e) => {
      //   setSelection([index]);
      // }}
      ref={ref}
      role={message.role}
      contentType={contentType}
      isSelected={isSelected}
      isDarkMode={isDarkMode}
      experimentLayout={experimentLayout}
      onMouseUp={() => {
        if (selection?.length === 2) return;
        if (isSelected) return;
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
  history,
  autoScroll,
  autoScrollAnchor = "first",
}: {
  history: Message[];
  autoScroll?: boolean;
  autoScrollAnchor?: "first" | "last";
}) {
  const Anchor = useScrollToTop("top", [history.length, autoScroll, autoScrollAnchor]);
  const [selection, setSelection] = useAtom(selectionAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);

  useHandlers({
    Escape: () => {
      setSelection(null);
    },
  });

  useEffect(() => {
    return () => void setSelection(null);
  }, []);

  const keyedHistory = useMemo(() => {
    const keyed = history.map((message, index) => ({ ...message, key: index }));
    return [...keyed].reverse();
  }, [history]);

  if (keyedHistory.length === 0) {
    return <Banner>∅</Banner>;
  }
  return (
    <ChatContainer isDarkMode={isDarkMode}>
      {autoScroll && autoScrollAnchor === "first" && <Anchor />}
      {keyedHistory.map?.(({ key, ...message }) => {
        return <ChatMessage key={key} message={message} index={key} />;
      })}
      {autoScroll && autoScrollAnchor === "last" && <Anchor />}
    </ChatContainer>
  );
}
