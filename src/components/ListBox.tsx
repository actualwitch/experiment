import * as React from "react";
import styled from "@emotion/styled";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import type { ListState } from "react-stately";
import { useListBox, useOption } from "react-aria";
import { TRIANGLE } from "../const";
import { Palette } from "../style/palette";

interface ListBoxProps extends AriaListBoxOptions<unknown> {
  listBoxRef?: React.RefObject<HTMLUListElement>;
  state: ListState<unknown>;
}

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

const List = styled.ul`
  max-height: 300px;
  overflow: auto;
  list-style: none;
  margin: 4px 0;
  outline: none;
  width: 100%;
  && {
    padding: 0;
  }
`;

interface ListItemProps {
  isFocused?: boolean;
  isSelected?: boolean;
}

const ListItem = styled.li<ListItemProps>`
  background: ${(props) => (props.isFocused ? Palette.buttonHoverBackground : Palette.actionableBackground)};
  color: ${(props) =>
    props.isFocused ? "white"
    : props.isSelected ? Palette.black
    : "#333"};
  font-size: 14px;
  font-weight: ${(props) => (props.isSelected ? "600" : "normal")};
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: default;
  outline: none;
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
`;

export function ListBox(props: ListBoxProps) {
  const ref = React.useRef<HTMLUListElement>(null);
  const { listBoxRef = ref, state } = props;
  const { listBoxProps } = useListBox(props, state, listBoxRef);

  return (
    <List {...listBoxProps} ref={listBoxRef}>
      {[...state.collection].map((item) => (
        <Option key={item.key} item={item} state={state} />
      ))}
    </List>
  );
}

interface OptionContextValue {
  labelProps: React.HTMLAttributes<HTMLElement>;
  descriptionProps: React.HTMLAttributes<HTMLElement>;
}

const OptionContext = React.createContext<OptionContextValue>({
  labelProps: {},
  descriptionProps: {},
});

function Option({ item, state }: OptionProps) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { optionProps, labelProps, descriptionProps, isSelected, isFocused } = useOption(
    {
      key: item.key,
    },
    state,
    ref,
  );

  return (
    <ListItem {...optionProps} ref={ref} isFocused={isFocused} isSelected={isSelected}>
      <ItemContent>
        <OptionContext.Provider value={{ labelProps, descriptionProps }}>{item.rendered}</OptionContext.Provider>
      </ItemContent>
      {isSelected && TRIANGLE}
    </ListItem>
  );
}

// The Label and Description components will be used within an <Item>.
// They receive props from the OptionContext defined above.
// This ensures that the option is ARIA labelled by the label, and
// described by the description, which makes for better announcements
// for screen reader users.

export function Label({ children }: { children: React.ReactNode }) {
  const { labelProps } = React.useContext(OptionContext);
  return <div {...labelProps}>{children}</div>;
}

const StyledDescription = styled.div`
  font-weight: normal;
  font-size: 12px;
`;

export function Description({ children }: { children: React.ReactNode }) {
  const { descriptionProps } = React.useContext(OptionContext);
  return <StyledDescription {...descriptionProps}>{children}</StyledDescription>;
}
