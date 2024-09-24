import styled from "@emotion/styled";

type Primitive = string | number | boolean | null | undefined;

const isNullish = (input: unknown): input is null | undefined => input === null || input === undefined;

const Emphasis = styled.em`
  font-weight: italic;
  opacity: 0.7;
`;

function asTreeNodes(input: unknown, title?: Primitive, separator = ".") {
  // unwrap JSON strings
  if (typeof input === "string" && input[0] === "{" && input[input.length - 1] === "}") {
    try {
      input = JSON.parse(input);
      return asTreeNodes(input, title);
    } catch {}
  }
  const prefix = isNullish(title) || (Array.isArray(input) && input.length === 0) ? "" : <Emphasis>{title}</Emphasis>;
  if (input && typeof input === "object") {
    const keysArr = Array.isArray(input) ? Object.keys(input[0]) : undefined;
    // represent key-value arrays as objects
    if (keysArr?.length === 2 && keysArr.includes("key") && keysArr.includes("value")) {
      // @ts-ignore
      return asTreeNodes(Object.fromEntries(input.map(({ key, value }) => [key, value])), title);
    }
    const keys = Object.keys(input);
    // inline objects with a single key
    if (keys.length === 1) {
      const [key] = keys;
      return asTreeNodes(input[key as keyof typeof input], `${title}${separator}${key}`);
    }
    if (Array.isArray(input)) {
      return (
        <>
          {prefix}
          <ol>
            {input.map((item, idx) => (
              <li>{asTreeNodes(item, idx)}</li>
            ))}
          </ol>
        </>
      );
    } else {
      // sort objects by key, with nested objects at the end
      const sorted = Object.entries(input).sort(([aKey, aValue], [bKey, bValue]) => {
        if (typeof aValue === "object" && typeof bValue !== "object") return 1;
        if (typeof aValue !== "object" && typeof bValue === "object") return -1;
        return aKey.localeCompare(bKey);
      });
      return (
        <>
          {prefix}
          <ol>
            {sorted.map(([key, value]) => (
              <li>{asTreeNodes(value, key)}</li>
            ))}
          </ol>
        </>
      );
    }
  }
  return (
    <>
      {prefix}
      <ol>
        <li>{typeof input === "string" ? `"${input}"` : String(input)}</li>
      </ol>
      <hr />
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

export function View({ children, style }: { children: unknown; style?: React.CSSProperties }) {
  const content = typeof children === "string" ? asTextTreeNodes(children) : asTreeNodes(children);
  return <ViewContainer style={style}>{content}</ViewContainer>;
}
