import styled from "@emotion/styled";

type Primitive = string | number | boolean | null | undefined;

const isNullish = (input: unknown): input is null | undefined => input === null || input === undefined;

const Emphasis = styled.em`
  font-weight: italic;
  opacity: 0.7;
`;

function asTreeNodes(input: unknown, title?: Primitive) {
  const prefix = isNullish(title) ? "" : <Emphasis>{title}</Emphasis>;
  if (typeof input === "string") {
    return (
      <>
        {prefix}
        <ol>
          <li>"{input}"</li>
        </ol>
        <hr />
      </>
    );
  }
  if (Array.isArray(input)) {
    if (input.length > 0) {
      const [first] = input;
      const keys = Object.keys(first);
      if (keys.length === 2 && keys.includes("key") && keys.includes("value")) {
        return asTreeNodes(Object.fromEntries(input.map(({ key, value }) => [key, value])), title);
      }
    }
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
  }
  if (input && typeof input === "object") {
    const keys = Object.keys(input);
    if (keys.length === 1) {
      const [key] = keys;
      const newPrefix = isNullish(title) ? key : `${title}.${key}`;
      return asTreeNodes((input as Record<string, unknown>)[key], newPrefix);
    }
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
  return (
    <>
      {prefix}
      <ol>
        <li>{String(input)}</li>
      </ol>
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
