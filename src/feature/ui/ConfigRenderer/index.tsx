import { type PrimitiveAtom, type Setter, useAtom, useSetAtom } from "jotai";
import { Fragment, createElement, useId, type ReactNode } from "react";
import { Item } from "react-stately";
import { processCsvAtom } from "../../../atoms/client";
import { Select } from "../Select";
import { Slider } from "../Slider";
import { store } from "../../../store";
import { Button } from "../../../style";

export type LeafWithOptions<T extends string = string> = {
  label: string;
  atom: PrimitiveAtom<T>;
  options: Array<{ id: string; name: string }>;
};

export type LeafWithSlider = {
  label: string;
  atom: PrimitiveAtom<number>;
};

export type LeafWithCSVImport = {
  label: string;
  type: "csv";
};

export type LeafWithAction = {
  label: string;
  icon?: (props: { size?: number }) => ReactNode;
  action: (set: Setter) => void;
  disabled?: boolean;
};

export type LeafWithButtons = {
  buttons: Array<LeafWithAction>;
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

const CsvInput = () => {
  const processFile = useSetAtom(processCsvAtom);

  return (
    <p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          processFile(e.target.files?.[0]);
        }}
      />
    </p>
  );
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
          {children.buttons.map((button, index) => {
            const Icon = button?.icon;
            return (
              <Button
                key={`${id}-${index}`}
                type="submit"
                disabled={button.disabled}
                onClick={() => {
                  button.action(store.set);
                }}
              >
                {Icon && <Icon size={12} />} {button.label}
              </Button>
            );
          })}
        </p>
      );
    }
    if (children.label) {
      if (children.type === "csv") {
        return <CsvInput />;
      }
      if (children.action) {
        const Icon = children?.icon;
        return (
          <Button
            type="submit"
            disabled={children.disabled}
            onClick={() => {
              children.action(store.set);
            }}
          >
            {Icon && <Icon size={12} />} {children.label}
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
