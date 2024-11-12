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

export const Switch = ({
  value,
  onChange,
  children,
}: {
  value: SwitchValue;
  onChange: (value: SwitchValue) => void;
  children: Array<{ value: SwitchValue; label: string }>;
}) => {
  return (
    <Container>
      {children.map(({ value: v, label }) => (
        <Button key={label} type="button" onClick={() => onChange(v)} disabled={v === value}>
          {label}
        </Button>
      ))}
    </Container>
  );
};
