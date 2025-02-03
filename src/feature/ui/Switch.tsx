import styled from "@emotion/styled";
import { ellipsis } from "polished";
import { Button } from "../../style";

export type SwitchValue = boolean | undefined;

const Container = styled.div`
  display: flex;
  flex-wrap: nowrap;
  button {
    ${ellipsis()}
    border-radius: 0;
    &:first-of-type {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }
    &:last-of-type {
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
  button + button {
    margin: 0;
  }
`;

export function Switch<T>({
  value,
  onChange,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  children: Array<{ value: T; name: string; isDefault?: true }>;
}) {
  return (
    <Container>
      {children.map(({ value: v, name, isDefault }) => (
        <Button
          key={name}
          type="button"
          onClick={() => onChange(v)}
          disabled={value !== undefined ? v === value : isDefault}
        >
          {name}
        </Button>
      ))}
    </Container>
  );
}
