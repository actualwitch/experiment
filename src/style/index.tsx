import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { atom, useAtom } from "jotai";
import { type HTMLProps, useRef } from "react";
import { useButton } from "react-aria";
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

const internalDarkModeButton = css`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px ${Palette.buttonShadowDark}21;
    :hover {
      box-shadow: 0px 1px 14px 4px ${Palette.buttonShadowDark}52;
    }
  }
`;

const InternalButton = styled.button<{ isDarkMode: boolean | undefined }>`
  &:not(:disabled) {
    box-shadow: 2px 2px 8px ${Palette.black}20;
    text-shadow:
      1px 0px 1px ${Palette.black}24,
      -1px 0px 1px ${Palette.white}b8;
    :hover {
      box-shadow: 0px 1px 8px 2px ${Palette.buttonHoverDark}24;
    }
    :active {
      transform: translate(0px, 1px);
    }
  }
  ${(p) => withDarkMode(p.isDarkMode, internalDarkModeButton)}
`;

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
  const { buttonProps } = useButton(
    { ...props, isDisabled: props.disabled, onClick, onPress: props.onPress ?? onClick },
    ref,
  );
  return (
    <InternalButton isDarkMode={isDarkMode} {...buttonProps}>
      {props.children}
    </InternalButton>
  );
};

// export const Button = injectAtoms({ isDarkMode: isDarkModeAtom })(InternalButton);

const button = css`
  button:not(:disabled) {
    background-color: ${Palette.actionableBackground};
    :hover {
      background-color: ${Palette.buttonHoverBackground};
    }
  }
  button {
    ${content}
    text-transform: capitalize;
    padding: 4px 13px;
    margin: 0;
    transition:
      background-color 0.1s ease-out,
      box-shadow 0.1s ease-out,
      transform 0.1s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    border: 1px solid transparent;
    color: ${Palette.black};
    border-radius: 6px;
    cursor: pointer;
    transform: translate(0px, 0px);
    &[disabled] {
      background-color: ${Palette.buttonDisabledBackground};
      color: ${Palette.buttonDisabledForeground};
      cursor: not-allowed;
      border-color: ${Palette.buttonDisabledBorder};
    }
  }
  button + button {
    margin-left: ${bs(1 / 4)};
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
`;

const inputDarkMode = css`
  input {
    color: ${Palette.black};
  }
`;

export const Container = styled.div(
  content,
  css`
    margin-bottom: 0;
    display: grid;
    grid-template-columns: 278px 1fr 320px;
    height: 100dvh;
    & > * {
      padding: ${bs()};
      overflow: auto;
    }
  `,
);

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
    hyphens: auto;
    th {
      border-bottom: 1px solid ${Palette.white};
    }
    pre {
      background-color: ${Palette.white}30;
    }
    ${inputDarkMode}
  }
  ${buttonDarkMode}
`;

export const appStyle = [
  reset,
  shevyStyle,
  css`
    :root {
      background-color: ${Palette.white};
      font-family: ${fontFamily};
      font-weight: normal;

      ul,
      ol {
        margin-bottom: ${bs(1 / 6)};
        padding-left: ${bs(3 / 2)};
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
        code {
          background: none;
        }
        font-size: 0.75em;
        background-color: ${Palette.black}10;
        padding: ${bs(1 / 3)} ${bs(1 / 2)};
        border-radius: ${bs(1 / 3)};
        overflow-x: scroll;
      }

      style {
        display: none;
      }

      ${["h1", "h2", "h3", "h4", "h5", "h6"].map((el) => `* + ${el}`).join(",")} {
        margin-top: ${bs(2 / 3)};
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

    ${button}

    ${input}
  `,
];

export const stylesAtom = atom((get) => {
  const isDarkMode = get(isDarkModeAtom);
  const darkModeStyle = withDarkMode(isDarkMode, darkMode);
  return [...appStyle, darkModeStyle];
});
