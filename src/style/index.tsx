import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import type { HTMLProps } from "react";
import Shevy from "shevyjs";
import { isDarkModeAtom } from "../state/common";
import { withDarkMode } from "./darkMode";
import { Palette } from "./palette";
import { reset } from "./reset";

const config: {
  fontScale: "majorSecond" | "minorThird" | "majorThird" | "perfectFourth" | "augmentedFourth";
} = {
  fontScale: "minorThird",
};

export const fontFamily = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = Shevy(config);
const shevyStyle = css({ body, h1, h2, h3, h4, h5, h6, ["p, ol, ul, pre"]: content });

const internalDarkModeButton = css`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px #ececec21;
    :hover {
      box-shadow: 0px 1px 14px 4px #ececec52;
    }
  }
`;

const InternalButton = styled.button<{ isDarkMode: boolean }>`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px #00000020;
    text-shadow: 1px 0px 1px #00000024, -1px 0px 1px #ffffffb8;
    :hover {
      box-shadow: 0px 1px 8px 2px #1a1a1a24;
    }
    :active {
      transform: translate(0px, 1px);
    }
  }
  ${(p) => withDarkMode(p.isDarkMode, internalDarkModeButton)}
`;

export const Button = ({ children, ...props }: HTMLProps<HTMLButtonElement>) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  return (
    <InternalButton isDarkMode={isDarkMode} {...props}>
      {children}
    </InternalButton>
  );
};

const button = css`
  button:not(:disabled) {
    background-color: ${Palette.actionableBackground};
    :hover {
      background-color: color(display-p3 0 0 0 / 0.19);
    }
  }
  button {
    ${content}
    text-transform: capitalize;
    padding: 4px 13px;
    margin: 0;
    transition: background-color 0.1s ease-out, box-shadow 0.1s ease-out,
      transform 0.1s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    border: 1px solid transparent;
    color: black;
    border-radius: 6px;
    cursor: pointer;
    transform: translate(0px, 0px);
    &[disabled] {
      background-color: #b5b5b50f;
      color: #e6e6e6;
      cursor: not-allowed;
      border-color: #8888880f;
    }
  }
  button + button {
    margin-left: ${bs(1 / 4)};
  }
`;

const buttonDarkMode = css`
  button:not(:disabled) {
    :hover {
      background-color: #fff;
    }
  }
  button[disabled] {
    background-color: transparent;
    box-shadow: none;
    border-color: #ffffff54;
    color: #ffffff54;
  }
`;

const input = css`
  input {
    background-color: #eee;
  }
`;

export const Container = styled.div(
  content,
  css`
    margin-bottom: 0;
    display: grid;
    grid-template-columns: 278px 1fr 320px;
    height: 100lvh;
    & > * {
      padding: ${bs()};
      overflow: auto;
    }
  `,
);

export const Main = styled.main(
  css`
    overflow-x: scroll;
  `,
);

export const Paragraph = styled.p(
  css`
    font-size: ${bs()};
  `,
);

export const darkMode = css`
  :root {
    background-color: #000;
    color: white;
  }
  ${buttonDarkMode}
`;

export const appStyle = [
  reset,
  shevyStyle,
  css`
    :root {
      font-family: ${fontFamily};
      font-weight: normal;

      ul,
      ol {
        list-style: none;
        margin-bottom: 0;
      }
    }
    ::selection {
      background-color: ${Palette.accent};
    }
    a {
      color: inherit;
      text-decoration: none;
      transition: color 0.1s ease-out;
      &[aria-current="page"] {
        text-decoration: underline;
      }
      &:hover {
        color: LinkText;
      }
    }

    input,
    code,
    button {
      font: inherit;
    }

    ${button}

    ${input}
  `,
];

const systemDarkMode = css`
  @media (prefers-color-scheme: dark) {
    ${darkMode}
  }
`;

export const stylesAtom = atom((get) => {
  const isDarkMode = get(isDarkModeAtom);
  if (isDarkMode === undefined) {
    return [...appStyle, systemDarkMode];
  }
  return isDarkMode ? [...appStyle, darkMode] : appStyle;
});
