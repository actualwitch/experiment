import styled from "@emotion/styled";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import { ReactNode, useRef } from "react";
import { Editor } from "~/editor";
import { Message, newChatAtom, templatesAtom } from "~/state/common";
import { bs, Message as MessageComponent } from "~/style";
import { View } from "~/view";

const baseHeight = bs(6);
export const ChatContainer = styled.div`
  & > * {
    min-height: ${baseHeight}}
  }
`;

type Path = [number] | [number, "content"];
export const selectionAtom = atom<Path | null>(null);

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

export const ChatMessage = ({ message: _message, index }: { message: Message; index: number }) => {
  const [selection, setSelection] = useAtom(selectionAtom);
  const setter = useSetAtom(lensAtom);
  const templates = useAtomValue(templatesAtom);

  const selector: Path = [index, "content"];
  const message = { ..._message };
  for (const [name, template] of Object.entries(templates ?? {})) {
    if (message.content === template.content && message.role === template.role) {
      message.content = name;
      message.template = true;
    }
  }

  const isSelected = index === selection?.[0];

  const ref = useRef<null | HTMLElement>(null);

  let innerContent: ReactNode;

  let contentType: string | undefined;

  if (isSelected && selection?.[1] === "content") {
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
  }
  if (["string", "object"].includes(typeof message.content)) {
    contentType = message.template ? "template" : typeof message.content;
    innerContent ??= (
      <View
        style={{
          float: message.fromServer ? "right" : "left",
        }}>
        {message.content}
      </View>
    );
  }
  innerContent ??= <code>{"<Empty>"}</code>;

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

  return (
    <ChatContainer>
      {chat?.map?.((message, index) => {
        return <ChatMessage key={index} message={message} index={index} />;
      })}
    </ChatContainer>
  );
}
