import styled from "@emotion/styled";
import { Button } from "../style";

export type SwitchValue = boolean | undefined;

const Container = styled.div`
  button {
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
  children: Array<{ value: T; label: string; isDefault?: true }>;
}) {
  return (
    <Container>
      {children.map(({ value: v, label, isDefault }) => (
        <Button
          key={label}
          type="button"
          onClick={() => onChange(v)}
          disabled={value !== undefined ? v === value : isDefault}
        >
          {label}
        </Button>
      ))}
    </Container>
  );
}
