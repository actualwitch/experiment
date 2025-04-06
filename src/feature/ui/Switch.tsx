import styled from "@emotion/styled";
import { ellipsis } from "polished";
import { bs, Button } from "../../style";
import { Palette } from "../../style/palette";

export type SwitchValue = boolean | undefined;

const Container = styled.div`
  display: flex;
  flex-wrap: nowrap;
  button {
    ${ellipsis()}
    border-radius: 0;
    &:first-of-type {
      border-top-left-radius: ${bs(Palette.borderCode)};
      border-bottom-left-radius: ${bs(Palette.borderCode)};
    }
    &:last-of-type {
      border-top-right-radius: ${bs(Palette.borderCode)};
      border-bottom-right-radius: ${bs(Palette.borderCode)};
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
  children: Array<{ value: T; name: string; isDefault?: true; isDisabled?: boolean }>;
}) {
  return (
    <Container>
      {children.map(({ value: v, name, isDefault, isDisabled }) => (
        <Button
          key={name}
          type="button"
          onClick={() => onChange(v)}
          disabled={isDisabled || (value !== undefined ? v === value : isDefault)}
        >
          {name}
        </Button>
      ))}
    </Container>
  );
}
