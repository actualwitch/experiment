import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import { cover } from "polished";
import { type HTMLProps, useRef } from "react";
import { useButton } from "react-aria";
import Shevy from "shevyjs";
import { type WithLayout, fontStackAtom, isBoldTextAtom, isDarkModeAtom } from "../atoms/common";
import { type WithDarkMode, withDarkMode } from "./darkMode";
import { withOnMobile } from "./layout";
import { interactive } from "./mixins";
import { Palette } from "./palette";
import { reset } from "./reset";

const config: {
  fontScale: "majorSecond" | "minorThird" | "majorThird" | "perfectFourth" | "augmentedFourth";
} = {
  fontScale: "minorThird",
};

// from https://github.com/system-fonts/modern-font-stacks
export const FONT_STACKS = {
  "System UI": "system-ui, sans-serif",
  "Transitional": "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
  "Old Style": "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif",
  "Humanist": "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif",
  "Geometric Humanist": "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif",
  "Classic Humanist": "Optima, Candara, 'Noto Sans', source-sans-pro, sans-serif",
  "Neo Grotesque": "Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif",
  "Monospace Slab Serif": "'Nimbus Mono PS', 'Courier New', monospace",
  "Monospace Code": "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  "Industrial":
    "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif",
  "Rounded Sans":
    "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif",
  "Slab Serif": "Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif",
  "Antique": "Superclarendon, 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', Georgia, serif",
  "Didone": "Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen, serif",
} as const;

export const withEmoji = ", 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = Shevy(config);
const shevyStyle = css({
  body,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  "p, ol, ul, pre": content,
});

export const iSawTheButtonsGlowLightMode = css`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px ${Palette.black}20;
    :hover {
      box-shadow: 0px 1px 8px 2px ${Palette.buttonHoverDark}24;
    }
  }
`;

export const iSawTheButtonGlow = css`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px ${Palette.buttonShadowDark}21;
    :hover {
      box-shadow: 0px 1px 14px 4px ${Palette.buttonShadowDark}52;
    }
  }
`;

export const bevelStyle = css`
  &:not(:disabled) {
    text-shadow:
      1px 0px 1px ${Palette.black}24,
      -1px 0px 1px ${Palette.white}b8;
  }
`;

export const buttonPopModifier = css`
  transform: translate(0px, 0px);
  :active {
    transform: translate(0px, 1px);
  }
`;

const InternalButton = styled.button<WithDarkMode>(iSawTheButtonsGlowLightMode,  (p) =>
  withDarkMode(p.isDarkMode, iSawTheButtonGlow),
);

// function injectAtoms<T extends Record<string, unknown>, P extends {}>(atoms: T) {
//   const newProps = {} as Record<string, unknown>;
//   for (const key in atoms) {
//     const [value] = useAtom(atoms[key] as any);
//     newProps[key] = value;
//   }
//   return (Component: React.ComponentType<P>) => ((props: T & P) => <Component {...props} {...newProps} />);
// }

export const Button = ({ onClick, ...props }: HTMLProps<HTMLButtonElement>) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const ref = useRef<HTMLButtonElement | null>(null);
  const { buttonProps } = useButton({ ...props, isDisabled: props.disabled, onPress: props.onPress ?? onClick }, ref);
  return (
    <InternalButton isDarkMode={isDarkMode} {...buttonProps}>
      {props.children}
    </InternalButton>
  );
};

// export const Button = injectAtoms({ isDarkMode: isDarkModeAtom })(InternalButton);

const button = css`
  button {
    display: flex;
    align-items: end;
    gap: 6px;
    svg {
      margin-bottom: 5px;
    }
  }
  button:not(:disabled) {
    background-color: ${Palette.actionableBackground};
    :hover {
      background-color: ${Palette.buttonHoverBackground};
    }
  }
  button[disabled] {
    background-color: ${Palette.disabledBackground};
    color: ${Palette.black}54;
    cursor: not-allowed;
  }
  button,
  input[type="file"]::file-selector-button {
    ${content}
    padding: 4px 13px;
    margin: 0;
    outline: 0;
    transition:
      background-color 0.1s ease-out,
      box-shadow 0.1s ease-out,
      transform 0.1s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    border: 1px solid transparent;
    color: ${Palette.black};
    border-radius: ${bs(Palette.borderCode)};
    ${interactive}
    ${buttonPopModifier}
    ${iSawTheButtonsGlowLightMode}
    ${bevelStyle}
    &[disabled] {
      background-color: ${Palette.buttonDisabledBackground};
      color: ${Palette.buttonDisabledForeground};
      cursor: not-allowed;
      border-color: ${Palette.buttonDisabledBorder};
    }
  }
`;

const buttonDarkMode = css`
  button:not(:disabled) {
    :hover {
      background-color: ${Palette.white};
    }
  }
  button[disabled] {
    background-color: transparent;
    box-shadow: none;
    border-color: ${Palette.white}54;
    color: ${Palette.white}54;
  }
`;

const input = css`
  input:not([type="file"]) {
    background-color: ${Palette.inputBackground};
  }
  input[type="file"] {
    width: 94px;
  }
`;

const inputDarkMode = css`
  input {
    color: ${Palette.black};
  }
`;

export const sidebarWidth = "320px";

export const Container = styled.div<WithLayout>(
  content,
  css`
    margin-bottom: 0;
    display: flex;
    height: 100svh;
  `,
  (p) =>
    withOnMobile(
      p.layout,
      css`
        position: relative;
        overflow: hidden;
        grid-template-columns: 1fr;
      `,
    ),
);

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  padding: ${bs()};
  overflow: auto;
  flex: 0 ${sidebarWidth};
  & > * {
    display: flex;
    flex-wrap: wrap;
  }
  & > div {
    margin-bottom: ${bs(1 / 2)};
  }
  & > p {
    gap: ${bs(1 / 4)};
  }
  div + p {
    margin-top: ${bs(1 / 2)};
  }
`;

export const Main = styled.main(css`
  overflow-x: scroll;
`);

export const Paragraph = styled.p(css`
  font-size: ${bs()};
`);

export const darkMode = css`
  :root {
    background-color: ${Palette.black};
    color: ${Palette.white};
    th {
      border-bottom: 1px solid ${Palette.white};
    }
    pre {
      background-color: ${Palette.white}30;
    }
  }
  ${buttonDarkMode}
  ${inputDarkMode}
`;

export const appStyle = [
  reset,
  shevyStyle,
  css`
    html {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    :root {
      background-color: ${Palette.white};
      color: ${Palette.black};
      font-weight: normal;
      hyphens: auto;

      ul,
      ol {
        margin-bottom: ${bs(1 / 6)};
        padding-left: ${bs()};
      }

      table {
        border-collapse: collapse;
      }

      th {
        border-bottom: 1px solid ${Palette.black};
      }

      th,
      td {
        padding: 0 ${bs(1 / 4)} ${bs(1 / 10)};
      }

      pre {
        font-size: 0.75em;
        background-color: ${Palette.black}10;
        padding: ${bs(1 / 3)} ${bs(1 / 2)};
        border-radius: ${bs(Palette.borderCode)};
        overflow-x: scroll;
        position: relative;
        code {
          background: none;
        }
      }

      style {
        display: none;
      }
    }
    ::selection {
      background-color: ${Palette.accent};
    }
    a {
      color: inherit;
      transition: color 0.1s ease-out;
      &:hover {
        color: ${Palette.link};
      }
    }

    input,
    code,
    button {
      font: inherit;
    }

    body {
      overflow-x: hidden;
    }

    pre code {
      font-family: ${FONT_STACKS["Monospace Code"]};
    }

    ${button}
    ${input}

    blockquote {
      border-left: 2px solid currentColor;
      padding-left: ${bs(1 / 4)};
    }
  `,
];

export const stylesAtom = atom((get) => {
  const styleSet = [...appStyle];
  const isDarkMode = get(isDarkModeAtom);
  const darkModeStyle = withDarkMode(isDarkMode, darkMode);
  const fontStack = get(fontStackAtom) ?? "Transitional";
  styleSet.push(darkModeStyle);
  styleSet.push(css`
    :root,
    pre {
      font-family: ${FONT_STACKS[fontStack]}${withEmoji};
    }
  `);
  const isBoldText = get(isBoldTextAtom);
  if (isBoldText) {
    styleSet.push(css`
      body {
        font-weight: bold;
      }
    `);
  }
  return styleSet;
});

export const Slideover = styled.aside<{ isOpen: boolean; from?: "left" | "right" } & WithDarkMode>`
  ${cover()}
  background-color: ${Palette.white};
  z-index: 2;
  transition: transform 100ms ease-out;
  display: flex;
  flex-direction: column;
  & > * {
    flex: 1;
  }
  ${(p) =>
    withDarkMode(
      p.isDarkMode,
      css`
        background-color: ${Palette.black};
      `,
    )}
  ${(p) =>
    p.isOpen ?
      css`
        transform: translateX(0);
      `
    : css`
        transform: translateX(${p.from === "left" ? "" : "-"}100%);
      `}
`;
