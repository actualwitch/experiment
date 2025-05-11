import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom } from "jotai";
import Markdown, { type ReactRenderer } from "marked-react";
import {
  type JSX,
  type MouseEventHandler,
  type PropsWithChildren,
  type ReactNode,
  createElement,
  memo,
  useMemo,
} from "react";
import { bs } from "../../style";
import { increaseSpecificity } from "../../style/utils";
import { cancelEvent } from "../../utils/event";
import { Code } from "./Code";

type Primitive = string | number | boolean | null | undefined;

const isNullish = (input: unknown): input is null | undefined => input === null || input === undefined;

type Callback = (value: unknown, key: string | undefined, path: string[]) => void;
type TreeOptions = {
  onClick?: Callback;
  onTitleClick?: Callback;
  separator?: string;
  path?: string[];
  shouldBeCollapsed?: (path: string[]) => boolean;
  disableSorting?: boolean;
};

const interactive = css`
  cursor: pointer;
  user-select: none;
  :hover {
    opacity: 1;
  }
`;
const nonInteractive = css`
  user-select: none;
`;

const Emphasis = styled.em<{ isCollapsed?: boolean; isDisabled?: boolean }>(
  css`
    font-weight: italic;
    opacity: 0.7;
    transition: opacity 100ms ease-out;
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
  ({ isDisabled }) => (isDisabled ? nonInteractive : interactive),
);

const Item = styled.li<{ isDisabled?: boolean }>(({ isDisabled }) =>
  isDisabled
    ? nonInteractive
    : css`
      cursor: pointer;
      user-select: none;
      :hover > hr {
        opacity: 1;
      }
    `,
);

export const collapsedAtom = atom<string[]>([]);

function asTreeNodes(input: unknown, title?: Primitive, options: TreeOptions = {}): JSX.Element | null {
  // unwrap JSON strings
  if (typeof input === "string" && input[0] === "{" && input[input.length - 1] === "}") {
    try {
      input = JSON.parse(input);
      return asTreeNodes(input, title, options);
    } catch {}
  }
  const { separator = ".", onClick, onTitleClick, path = [], shouldBeCollapsed, disableSorting } = options;

  const prefix = isNullish(title) || (Array.isArray(input) && input.length === 0) ? "" : title;
  const interactiveProps = onTitleClick
    ? ({
        onClick(e) {
          cancelEvent(e);
          onTitleClick(prefix, undefined, path);
        },
      } as {
        onClick: MouseEventHandler<HTMLElement>;
      })
    : { isDisabled: true };
  if (shouldBeCollapsed?.(path)) {
    return prefix ? (
      <Emphasis isCollapsed {...interactiveProps}>
        {prefix}
      </Emphasis>
    ) : null;
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
        ...options,
        path: [...path, "key"],
      });
    }
    const entries = Object.entries(input);
    // sort objects by key, with nested objects at the end
    if (!disableSorting && !Array.isArray(input)) {
      entries.sort(([aKey, aValue], [bKey, bValue]) => {
        if (typeof aValue === "object" && typeof bValue !== "object") return 1;
        if (typeof aValue !== "object" && typeof bValue === "object") return -1;
        if (typeof aValue === "number" && typeof bValue === "number") return aValue - bValue;
        return aKey.localeCompare(bKey);
      });
    }
    inner = entries.map(([key, value]) => (
      <Item
        key={key}
        {...(onClick
          ? {
              onClick: (e) => {
                cancelEvent(e);
                onClick(value, key, path);
              },
            }
          : { isDisabled: true })}
      >
        {asTreeNodes(value, key, {
          ...options,
          path: [...path, key],
        })}
      </Item>
    ));
  } else {
    inner = String(input);
  }
  return (
    <>
      {prefix && (
        <Emphasis isCollapsed={false} {...interactiveProps}>
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
  const currentBlock = "p";
  const level = 0;
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

const ViewContainer = styled.div<PropsWithChildren<{ markdownMode?: true }>>`
  word-wrap: anywhere;
  li p {
    margin-bottom: ${bs(1 / 3)};
  }
  pre {
    overflow: hidden;
    overflow-x: scroll;
    scrollbar-width: none;
  }
  ${(p) =>
    !p.markdownMode &&
    css`
      ul,
      ol {
        list-style: none;
        margin-bottom: ${bs(1 / 6)};
      }

      hr {
        margin-top: ${bs(0.15)};
        margin-bottom: ${bs(0.05)};
      }
    `}
  }
`;

export function Paragraph({ children }: { children?: ReactNode }) {
  const parsedContent = useMemo(() => {
    try {
      if (Array.isArray(children) && children.length === 1 && typeof children[0] === "string")
        return JSON.parse(children[0]);
    } catch (e) {
      return null;
    }
  }, [children]);
  if (parsedContent) return <View>{parsedContent}</View>;
  return <p>{children}</p>;
}

const renderer: Partial<ReactRenderer> = {
  code(snippet, lang) {
    return <Code key={this.elementId} language={lang} value={snippet} />;
  },
  heading(children, level) {
    const Heading = `h${Math.min(6, level + 3)}` as "h4" | "h5" | "h6";
    return <Heading key={this.elementId}>{children}</Heading>;
  },
  paragraph(children) {
    return <Paragraph key={this.elementId}>{children}</Paragraph>;
  },
};

const MarkdownComponent = ({ children, style }: { children: string; style?: React.CSSProperties }) => {
  return (
    <ViewContainer markdownMode style={style}>
      <Markdown value={children} renderer={renderer} />
    </ViewContainer>
  );
};

export function ViewComponent({
  children,
  style,
  onClick,
  onTitleClick,
  shouldBeCollapsed,
  renderMode,
  disableSorting,
}: {
  children: unknown;
  style?: React.CSSProperties;
  renderMode?: "markdown" | "text";
} & Pick<TreeOptions, "onClick" | "onTitleClick" | "shouldBeCollapsed" | "disableSorting">) {
  const mode = renderMode ?? "markdown";
  if (typeof children === "string") {
    if (mode === "markdown") {
      return <MarkdownComponent style={{ ...style, width: undefined }}>{children}</MarkdownComponent>;
    }
    return <ViewContainer style={style}>{Array.from(asTextTreeNodes(children))}</ViewContainer>;
  }

  const content = asTreeNodes(children, undefined, {
    onClick,
    onTitleClick,
    shouldBeCollapsed,
    disableSorting,
  });
  return (
    <ViewContainer className="view-container" style={style}>
      {content}
    </ViewContainer>
  );
}

export const View = memo(ViewComponent);
