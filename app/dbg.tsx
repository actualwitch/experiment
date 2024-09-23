import styled from "@emotion/styled";
import { useState } from "react";

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
  if (typeof input === "object") {
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

export function ColorPicker() {
  const [c1, setC1] = useState(0.372);
  const [c2, setC2] = useState(0.903);
  const [c3, setC3] = useState(0.775);
  const [a, setA] = useState(1.0);
  const color = `color(display-p3 ${c1} ${c2} ${c3} / ${a})`;
  return (
    <>
      <div>
        <button type="submit" style={{ backgroundColor: color }}>
          system
        </button>
      </div>
      <div>
        <input
          type="range"
          value={c1}
          onChange={(e) => setC1(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c2}
          onChange={(e) => setC2(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c3}
          onChange={(e) => setC3(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input type="range" value={a} onChange={(e) => setA(parseFloat(e.target.value))} min={0} max={1} step={0.01} />
      </div>
    </>
  );
}
