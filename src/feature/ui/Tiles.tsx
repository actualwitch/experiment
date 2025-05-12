import styled from "@emotion/styled";
import { ellipsis } from "polished";
import { bs, Button } from "../../style";
import { Palette } from "../../style/palette";

export type SwitchValue = boolean | undefined;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${bs(1 / 2)};

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    gap: 0;

    border-radius: 0;
    width: ${bs(4)};
    height: ${bs(4)};
    text-shadow: none;

    header {
      font-size: 32px;
    }
    footer {
      font-size: 14px;
    }
  }
`;

export function Tiles<T>({
  value,
  onChange,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  children: Array<{ value: T; name: string; icon: string; color?: string }>;
}) {
  return (
    <Container>
      {children.map(({ value: v, name, icon }) => (
        <Button key={name} type="button" onClick={() => onChange(v)}>
          <header>{icon}</header>
          <footer>{name}</footer>
        </Button>
      ))}
    </Container>
  );
}
