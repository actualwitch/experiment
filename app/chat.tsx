import { SerializedStyles, css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import { ReactNode, useRef } from "react";
import { Editor } from "~/editor";
import { isDarkModeAtom, Message, newChatAtom, store, templatesAtom } from "~/state/common";
import { bs } from "~/style";
import { View } from "~/view";

const baseHeight = bs(6);
export const ChatContainer = styled.div`
  & > * {
    min-height: ${baseHeight}}
  }
`;

export const MessageComponent = styled.article<{
  role: "system" | "user" | "assistant" | "tool";
  contentType?: string;
  ioType?: "input" | "output";
  isSelected: boolean;
}>(({ role, ioType, contentType, isSelected }) => {
  const fromServer = ioType === "output";
  const align = fromServer ? "right" : "left";
  const isDarkMode = store.get(isDarkModeAtom);
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
      }

      &:before {
        content: "${contentType ? contentType + " ▴ " : ""}${role}";
        position: absolute;
        ${align}: 0;
        transform-origin: ${align};
        ${
          fromServer
            ? css`
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
        color: ${isDarkMode ? "#fff" : "#000"};
        margin-top: ${bs(0.15)};
        margin-bottom: ${bs(0.05)};
      }
    `,
  ];
  if (role === "system") {
    styles.push(css`
      border-color: #fff433;
    `);
  }
  if (role === "user") {
    styles.push(css`
      border-color: #9b59d0;
    `);
  }
  if (role === "assistant") {
    styles.push(css`
      border-color: color(display-p3 0.9 0.66 0.81);
    `);
  }
  if (role === "tool") {
    styles.push(css`
      border-color: lightgreen;
    `);
  }
  if (isSelected) {
    if (isDarkMode) {
      styles.push(css`
        background-color: #ffffff30;
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
const collapsedAtom = atom<string[]>([]);

const lensAtom = atom(
  (get) => {
    const selection = get(selectionAtom);
    if (selection === null) {
      return get(newChatAtom);
    }
    const [idx, key] = selection;
    const lens = focusAtom(newChatAtom, (o) => {
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
      set(newChatAtom, update as Message[]);
      return;
    }
    const lens = focusAtom(newChatAtom, (o) => {
      const [idx, key] = selection;
      if (key === "content") {
        return o.nth(idx).prop("content");
      }
      return o.nth(idx);
    });
    set(lens, update);
  },
);

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (const [key, value] of Object.entries(a)) {
    if (!deepEqual(value, b[key])) return false;
  }
  return true;
}

export const ChatMessage = ({ message: _message, index }: { message: Message; index: number }) => {
  const [selection, setSelection] = useAtom(selectionAtom);
  const setter = useSetAtom(lensAtom);
  const templates = useAtomValue(templatesAtom);

  const selector: Path = [index, "content"];
  const message = { ..._message };
  for (const [name, template] of Object.entries(templates ?? {})) {
    if (message.role === template.role && deepEqual(message.content, template.content)) {
      message.template = name;
      break;
    }
  }

  const isSelected = index === selection?.[0];

  const ref = useRef<null | HTMLElement>(null);

  let innerContent: ReactNode;

  let contentType: string | undefined;

  if (message.template) {
    innerContent = (
      <div>λ {message.template}</div>
    );
  } else if (isSelected && selection?.[1] === "content") {
    const [{ height }] = ref.current?.getClientRects() ?? [{ height: baseHeight }];
    innerContent ??= (
      <Editor
        minHeight={height}
        setValue={(value) => {
          setter(value);
          setSelection(null);
        }}>
        {message.content}
      </Editor>
    );
  } else if (["string", "object"].includes(typeof message.content)) {
    contentType = typeof message.content;
    innerContent ??= (
      <View
      // onClick={(value, key, path) => {
      //   const fullPath = [...selector,...path, key];
      //   console.log(fullPath);
      // }}
        style={{
          float: message.fromServer ? "right" : "left",
        }}>
        {message.content}
      </View>
    );
  } else {
    innerContent ??= <code>{"<Empty>"}</code>;
  }

  return (
    <MessageComponent
      ref={ref}
      role={message.role}
      contentType={contentType}
      isSelected={isSelected}
      onClick={() => {
        if (selection?.length === 2) return;
        setSelection([selector[0]]);
      }}
      onDoubleClick={() => setSelection(selector)}
      ioType={message.fromServer ? "output" : "input"}>
      {innerContent}
    </MessageComponent>
  );
};

export function ChatPreview({ chatAtom }: { chatAtom: typeof newChatAtom }) {
  const [chat, setChat] = useAtom(chatAtom);

  // const [] = useState<string[]>([]);

  return (
    <ChatContainer>
      {chat?.map?.((message, index) => {
        return <ChatMessage key={index} message={message} index={index} />;
      })}
    </ChatContainer>
  );
}
