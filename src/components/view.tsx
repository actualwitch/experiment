import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import { createElement } from "react";

type Primitive = string | number | boolean | null | undefined;

const isNullish = (input: unknown): input is null | undefined => input === null || input === undefined;

type TreeOptions = {
  onClick?: Callback;
  onTitleClick?: Callback;
  separator?: string;
  path?: string[];
  shouldBeCollapsed?: (path: string[]) => boolean;
};

const interactive = css`
  cursor: pointer;
  user-select: none;
  :hover {
    opacity: 1;
  }
`;

const Emphasis = styled.em<{ isCollapsed?: boolean }>(
  css`
    font-weight: italic;
    opacity: 0.7;
  `,
  ({ isCollapsed }) => {
    if (!isCollapsed) return;
    return css`
      :before {
        content: "( ";
        opacity: 0.3;
      }
      :after {
        content: " )";
        opacity: 0.3;
      }
    `;
  },
  interactive,
);

export const collapsedAtom = atom<string[]>([]);

function asTreeNodes(
  input: unknown,
  title?: Primitive,
  { separator = ".", onClick, onTitleClick, path = [], shouldBeCollapsed }: TreeOptions = {},
) {
  // unwrap JSON strings
  if (typeof input === "string" && input[0] === "{" && input[input.length - 1] === "}") {
    try {
      input = JSON.parse(input);
      return asTreeNodes(input, title, { separator, onClick, onTitleClick, shouldBeCollapsed, path });
    } catch {}
  }
  const prefix = isNullish(title) || (Array.isArray(input) && input.length === 0) ? "" : title;
  if (shouldBeCollapsed?.(path)) {
    return (
      prefix && (
        <Emphasis
          isCollapsed
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTitleClick?.(prefix, undefined, path);
          }}>
          {prefix}
        </Emphasis>
      )
    );
  }
  let inner = null;
  if (typeof input === "string") {
    inner = `"${input}"`;
  } else if (input && typeof input === "object") {
    const keysArr = Array.isArray(input) ? Object.keys(input[0] ?? {}) : undefined;
    // represent key-value arrays as objects
    if (keysArr?.length === 2 && keysArr?.includes("key") && keysArr?.includes("value")) {
      // @ts-ignore
      return asTreeNodes(Object.fromEntries(input.map(({ key, value }) => [key, value])), title, {
        separator,
        onClick,
        onTitleClick,
        shouldBeCollapsed,
        path: [...path, "key"],
      });
    }
    const keys = Object.keys(input);
    // inline objects with a single key
    if (keys.length === 1) {
      const [key] = keys;
      const newTitle = isNullish(title) ? [key] : [title, key];
      return asTreeNodes(input[key as keyof typeof input], newTitle.join(separator), {
        separator,
        onClick,
        onTitleClick,
        shouldBeCollapsed,
        path: [...path, ...newTitle.map((key) => key.toString())],
      });
    }
    const entries = Object.entries(input);
    // sort objects by key, with nested objects at the end
    if (!Array.isArray(input)) {
      entries.sort(([aKey, aValue], [bKey, bValue]) => {
        if (typeof aValue === "object" && typeof bValue !== "object") return 1;
        if (typeof aValue !== "object" && typeof bValue === "object") return -1;
        if (typeof aValue === "number" && typeof bValue === "number") return aValue - bValue;
        return aKey.localeCompare(bKey);
      });
    }
    inner = entries.map(([key, value]) => (
      <li
        key={key}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(value, key, path);
        }}>
        {asTreeNodes(value, key, {
          separator,
          onClick,
          onTitleClick,
          shouldBeCollapsed,
          path: [...path, key],
        })}
      </li>
    ));
  } else {
    inner = String(input);
  }
  return (
    <>
      {prefix && (
        <Emphasis
          isCollapsed={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTitleClick?.(prefix, undefined, path);
          }}>
          {prefix}
        </Emphasis>
      )}
      <ol>{inner}</ol>
      {typeof input !== "object" && <hr />}
    </>
  );
}

function* asTextTreeNodes(input: string) {
  const stack = [];
  let buffer = "";
  let currentBlock = "p";
  let level = 0;
  let index = 0;
  for (const char of input) {
    if (char === "\n" && buffer) {
      try {
        const obj = JSON.parse(buffer);
        yield asTreeNodes(obj);
        buffer = "";
        continue;
      } catch {}
      yield createElement(currentBlock, { key: index++ }, buffer);
      buffer = "";
      continue;
    }
    buffer += char;
  }
  if (buffer) {
    yield <p key={index++}>{buffer}</p>;
  }
}

const ViewContainer = styled.div`
  & > p {
    margin: 0;
    word-wrap: anywhere;
  }
`;

type Callback = (value: unknown, key: string | undefined, path: string[]) => void;

export function View({
  children,
  style,
  onClick,
  onTitleClick,
  shouldBeCollapsed,
}: {
  children: unknown;
  style?: React.CSSProperties;
} & Pick<TreeOptions, "onClick" | "onTitleClick" | "shouldBeCollapsed">) {
  const content =
    typeof children === "string"
      ? [...asTextTreeNodes(children)]
      : asTreeNodes(children, undefined, { onClick, onTitleClick, shouldBeCollapsed });
  return <ViewContainer style={style}>{content}</ViewContainer>;
}