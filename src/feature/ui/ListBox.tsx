import styled from "@emotion/styled";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import { Check } from "lucide-react";
import * as React from "react";
import { useListBox, useOption } from "react-aria";
import type { ListState } from "react-stately";
import { interactive } from "../../style/mixins";
import { Palette } from "../../style/palette";
import { increaseSpecificity } from "../../style/utils";
import type { WithDarkMode } from "../../style/darkMode";
import { isDarkModeAtom } from "../../atoms/store";
import { useAtom } from "jotai";
import { bevelStyle } from "../../style";

interface ListBoxProps extends AriaListBoxOptions<unknown> {
  listBoxRef?: React.RefObject<HTMLUListElement>;
  state: ListState<unknown>;
}

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

const List = styled.ul`
  max-height: 294px;
  overflow: auto;
  list-style: none;
  scroll-snap-type: y proximity;
  scrollbar-width: none;
  outline: none;
  width: 100%;
  ${bevelStyle}
  ${increaseSpecificity()} {
    padding: 4px 0;
    margin-bottom: 0;
  }

  li:has(+ [data-hover="true"]) {
    isolation: isolate;
  }
`;

interface ListItemProps {
  isFocused?: boolean;
  isSelected?: boolean;
}

const ListItem = styled.li<ListItemProps & WithDarkMode>`
  outline: none;
  ${interactive}
  padding: 3px 8px;

  scroll-snap-align: center;

  ${(props) => props.isDarkMode && `color: ${Palette.black};`};

  & > div {
    background: ${({ isDarkMode, isFocused }) => (isFocused ? Palette.white : Palette.actionableBackground)};
    color: ${(props) => (props.isSelected ? Palette.black : "#333")};
    flex: 1;
    padding: 0 10px;
    border-radius: 5px;
    ${(p) => p.isFocused && "box-shadow: 0px 0px 16px white;"}
    transition: ${["background", "box-shadow"].map((prop) => `${prop} 0.1s ease-out`).join(", ")};
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const { optionProps, labelProps, descriptionProps, isSelected, isFocused } = useOption(
    {
      key: item.key,
    },
    state,
    ref,
  );

  return (
    <ListItem
      {...optionProps}
      ref={ref}
      isFocused={isFocused}
      isSelected={isSelected}
      isDarkMode={isDarkMode}
      data-hover={isFocused}
    >
      <ItemContent>
        <OptionContext.Provider value={{ labelProps, descriptionProps }}>{item.rendered}</OptionContext.Provider>
        {isSelected ? <Check size={12} /> : null}
      </ItemContent>
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
