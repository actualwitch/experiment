import { useAtom, type PrimitiveAtom, type Setter } from "jotai";
import { createElement, Fragment, useId, type PropsWithChildren } from "react";
import { Button } from "../style";
import { Slider } from "./Slider";
import { Select } from "./Select";
import { Item } from "react-stately";
import { store } from "../state/store";

export type LeafWithOptions<T extends string = string> = {
  label: string;
  atom: PrimitiveAtom<T>;
  options: Array<{ id: string; name: string }>;
};

export type LeafWithSlider = {
  label: string;
  atom: PrimitiveAtom<number>;
};

export type LeafWithAction = {
  label: string;
  action: (set: Setter) => void;
  disabled?: boolean;
};

export type LeafWithButtons = {
  buttons: Array<{
    label: string;
    action: (set: Setter) => void;
    disabled?: boolean;
  }>;
};

export type Leaf = LeafWithOptions | LeafWithSlider | LeafWithAction | LeafWithButtons;

export type Config =
  | {
      [k in string]: Leaf | Array<Leaf | boolean> | Config;
    }
  | boolean;

const RenderWithAtom = ({ children }: { children: LeafWithSlider | LeafWithOptions }) => {
  const [value, setValue] = useAtom(children.atom);
  if (typeof value === "number") {
    return (
      <Slider
        value={value}
        onChange={(value) => setValue(value)}
        label={children.label}
        minValue={0}
        maxValue={1}
        step={0.01}
        formatOptions={{ minimumFractionDigits: 2 }}
      />
    );
  }
  if (children.options) {
    return (
      <Select
        label={children.label}
        items={children.options}
        selectedKey={value}
        onSelectionChange={(value) => setValue(value)}
      >
        {(item) => (
          <Item textValue={item.name}>
            <div>{item.name}</div>
          </Item>
        )}
      </Select>
    );
  }
};

export const ConfigRenderer = ({ children, level = 3 }: { children: Config | boolean; level?: number }) => {
  const id = useId();
  if (!children) return null;
  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, index) => (
          <ConfigRenderer key={`${id}-${index}`} level={level}>
            {child}
          </ConfigRenderer>
        ))}
      </>
    );
  }
  if (typeof children === "object") {
    if (children.buttons) {
      return (
        <p>
          {children.buttons.map((button, index) => (
            <Button
              key={`${id}-${index}`}
              type="submit"
              disabled={button.disabled}
              onClick={() => {
                button.action(store.set);
              }}
            >
              {button.label}
            </Button>
          ))}
        </p>
      );
    }
    if (children.label) {
      if (children.action) {
        return (
          <Button
            type="submit"
            disabled={children.disabled}
            onClick={() => {
              children.action(store.set);
            }}
          >
            {children.label}
          </Button>
        );
      }
      return <RenderWithAtom>{children}</RenderWithAtom>;
    }
    return (
      <>
        {Object.entries(children).map(([key, value]) => (
          <Fragment key={key}>
            {createElement(`h${level}`, {}, key)}
            <ConfigRenderer level={level + 1}>{value}</ConfigRenderer>
          </Fragment>
        ))}
      </>
    );
  }
  return null;
};
