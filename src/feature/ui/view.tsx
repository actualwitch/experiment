import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom, useSetAtom } from "jotai";
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
import { rendererModeAtom } from "../../atoms/common";
import { TRIANGLE } from "../../const";
import { bs, Button } from "../../style";
import { nonInteractive } from "../../style/mixins";
import { increaseSpecificity } from "../../style/utils";
import { inlineButtonModifier } from "../router/NewExperiment";
import { hasBackend } from "../../utils/realm";
import { applyDiffAtom } from "../../atoms/diff";

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

const Emphasis = styled.em<{ isCollapsed?: boolean; isDisabled?: boolean }>(
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
  ({ isDisabled }) => (isDisabled ? nonInteractive : interactive),
);

export const collapsedAtom = atom<string[]>([]);

function asTreeNodes(
  input: unknown,
  title?: Primitive,
  { separator = ".", onClick, onTitleClick, path = [], shouldBeCollapsed, disableSorting }: TreeOptions = {},
): JSX.Element | null {
  // unwrap JSON strings
  if (typeof input === "string" && input[0] === "{" && input[input.length - 1] === "}") {
    try {
      input = JSON.parse(input);
      return asTreeNodes(input, title, {
        separator,
        onClick,
        onTitleClick,
        shouldBeCollapsed,
        path,
      });
    } catch {}
  }
  const prefix = isNullish(title) || (Array.isArray(input) && input.length === 0) ? "" : title;
  const interactiveProps =
    onTitleClick ?
      ({
        onClick(e) {
          e.preventDefault();
          e.stopPropagation();
          onTitleClick?.(prefix, undefined, path);
        },
      } as {
        onClick: MouseEventHandler<HTMLElement>;
      })
    : { isDisabled: true };
  if (shouldBeCollapsed?.(path)) {
    return prefix ?
        <Emphasis isCollapsed {...interactiveProps}>
          {prefix}
        </Emphasis>
      : null;
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
      <li
        key={key}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(value, key, path);
        }}
      >
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
  ${increaseSpecificity()} {
    & > * {
      margin-bottom: ${bs(1 / 3)};
    }
  }
  li p {
    margin-bottom: ${bs(1 / 3)};
  }
  ul ::marker {
    content: "▵ ";
  }
  ul ul ::marker {
    content: "${TRIANGLE} ";
  }
  pre {
    overflow: hidden;
  }
  ${(p) =>
    !p.markdownMode &&
    css`
      ul,
      ol {
        list-style-type: none;
      }
      ${["ul", "ol"].map((tag) => `:not(li) > ${tag}`).join(", ")} {
        padding-left: 0;
      }
    `}
  ${new Array(6)
    .fill(0)
    .map((_, i) => `& > h${i + 1}`)
    .join(", ")} {
    margin-bottom: ${bs(1 / 4)};
  }
`;

const ActionRow = styled.div`
  button {
    ${inlineButtonModifier}
  }
`;

const widen = (align: string, length: string) => `
padding-${align}: ${length};
margin-${align}: -${length};
`;

const newLine = `
`;

const Container = styled.div`
  overflow-x: scroll;
  scrollbar-width: none;
  ${["left", "right", "bottom"].map((align) => widen(align, bs(1 / 2))).join(newLine)}
`;

export function Code({ language, value }: { language?: string; value?: ReactNode }) {
  const applyDiff = useSetAtom(applyDiffAtom);
  if (language === "diff") {
    return (
      <>
        <pre>
          {hasBackend() ?
            <>
              <ActionRow>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    applyDiff(value);
                  }}
                >
                  Apply
                </button>
              </ActionRow>
              <hr />
            </>
          : null}
          <Container>
            <code>{value}</code>
          </Container>
        </pre>
      </>
    );
  }
  return (
    <pre>
      <Container>
        <code>{value}</code>
      </Container>
    </pre>
  );
}

// export function Paragraph({ children }: { children?: string }) {
//   const parsedContent = useMemo(() => {
//     try {
//       if (children) return JSON.parse(children);
//     } finally {
//       return children;
//     }
//   }, [children]);
// }

const renderer: Partial<ReactRenderer> = {
  code(snippet, lang) {
    return <Code key={this.elementId} language={lang} value={snippet} />;
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
  const [rendererMode, setRendererMode] = useAtom(rendererModeAtom);
  const mode = renderMode ?? rendererMode;
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
  return <ViewContainer style={style}>{content}</ViewContainer>;
}

export const View = memo(ViewComponent);
