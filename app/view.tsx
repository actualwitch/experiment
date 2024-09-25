import styled from "@emotion/styled";

type Primitive = string | number | boolean | null | undefined;

const isNullish = (input: unknown): input is null | undefined => input === null || input === undefined;

const Emphasis = styled.em`
  font-weight: italic;
  opacity: 0.7;
`;

function asTreeNodes(
  input: unknown,
  title?: Primitive,
  { separator = ".", onClick, path = [] }: { onClick?: Callback; separator?: string; path?: string[] } = {},
) {
  // unwrap JSON strings
  if (typeof input === "string" && input[0] === "{" && input[input.length - 1] === "}") {
    try {
      input = JSON.parse(input);
      return asTreeNodes(input, title, { separator, onClick, path });
    } catch {}
  }
  const prefix = isNullish(title) || (Array.isArray(input) && input.length === 0) ? "" : <Emphasis>{title}</Emphasis>;
  let inner = null;
  if (typeof input === "string") {
    inner = `"${input}"`;
  } else if (input && typeof input === "object") {
    const keysArr = Array.isArray(input) ? Object.keys(input[0]) : undefined;
    // represent key-value arrays as objects
    if (keysArr?.length === 2 && keysArr.includes("key") && keysArr.includes("value")) {
      // @ts-ignore
      return asTreeNodes(Object.fromEntries(input.map(({ key, value }) => [key, value])), title, {
        separator,
        onClick,
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
        path: [...path, ...newTitle.map((key) => key.toString())],
      });
    }
    let entries = Object.entries(input);
    // sort objects by key, with nested objects at the end
    if (!Array.isArray(input)) {
      entries = entries.sort(([aKey, aValue], [bKey, bValue]) => {
        if (typeof aValue === "object" && typeof bValue !== "object") return 1;
        if (typeof aValue !== "object" && typeof bValue === "object") return -1;
        if (typeof aValue === "number" && typeof bValue === "number") return aValue - bValue;
        return aKey.localeCompare(bKey);
      });
    }
    inner = entries.map(([key, value]) => (
      <li
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(value, key, path);
        }}>
        {asTreeNodes(value, key, {
          separator,
          onClick,
          path: [...path, key],
        })}
      </li>
    ));
  } else {
    inner = String(input);
  }
  return (
    <>
      {prefix}
      <ol>{inner}</ol>
      {typeof input !== "object" && <hr />}
    </>
  );
}

function asTextTreeNodes(input: string) {
  return input.split(". ").map((piece) => <p>{piece}.</p>);
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
}: {
  children: unknown;
  style?: React.CSSProperties;
  onClick?: Callback;
}) {
  const content =
    typeof children === "string" ? asTextTreeNodes(children) : asTreeNodes(children, undefined, { onClick });
  return <ViewContainer style={style}>{content}</ViewContainer>;
}
