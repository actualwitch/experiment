import { css, SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";
import { tryShevy } from "~/shevy";
import { isDarkModeAtom, store } from "~/state/common";

export const fontFamily = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = tryShevy();
const shevyStyle = css({ body, h1, h2, h3, h4, h5, h6, ["p, ol, ul, pre"]: content });

const button = css`
  button:not(:disabled) {
    background-color: #ddd;
    box-shadow: 2px 2px 8px #00000020;
    text-shadow: 1px 0px 1px #00000024, -1px 0px 1px #ffffffb8;
    :hover {
      background-color: color(display-p3 0 0 0 / 0.19);
      box-shadow: 0px 1px 8px 2px #1a1a1a24;
    }
    :active {
      transform: translate(0px, 1px);
    }
  }
  button {
    ${content}
    text-transform: capitalize;
    padding: 4px 13px;
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
    box-shadow: 2px 2px 8px #ececec21;
    :hover {
      background-color: #fff;
      box-shadow: 0px 1px 14px 4px #ececec52;
    }
  }
  button[disabled] {
    background-color: transparent;
    box-shadow: none;
    border-color: #ffffff54;
    color: #ffffff54;
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

export const Message = styled.article<{
  role: "system" | "user" | "assistant" | "tool";
  contentType?: string;
  ioType?: "input" | "output";
  isSelected: boolean;
}>(({ role, ioType, contentType, isSelected }) => {
  const align = ioType === "output" ? "right" : "left";
  const isDarkMode = store.get(isDarkModeAtom);
  const styles: SerializedStyles[] = [
    css`
      border-${align}: 4px solid transparent;
      position: relative;
      overflow: hidden;
      text-align: ${align};

      & > code, & > div {
        display: block;
        padding: ${bs(1 / 2)};
        padding-${align}: ${bs(1.5)};
        word-wrap: break-word;
      }

      &:before {
        content: "${contentType ? contentType + " ▴ " : ""}${role}";
        position: absolute;
        transform-origin: top left;
        transform: rotate(270deg) translate(calc(-100% - 12px), 4px);
        ${align}: 0;
      }

      ul,
      ol {
        list-style: none;
        margin-bottom: 0;
      }
      li ul,
      li ol {
        padding-${align}: ${bs(1)};
      }

      hr {
        opacity: 0.2;
        color: ${isDarkMode ? "#fff" : "#000"};
        margin-top: ${bs(0.15)};
        margin-bottom: ${bs(0.05)};
      }
    `,
  ];
  if (role === "system") {
    styles.push(css`
      border-color: #fff433;
    `);
  }
  if (role === "user") {
    styles.push(css`
      border-color: #9b59d0;
    `);
  }
  if (role === "assistant") {
    styles.push(css`
      border-color: color(display-p3 0.9 0.66 0.81);
    `);
  }
  if (role === "tool") {
    styles.push(css`
      border-color: lightgreen;
    `);
  }
  if (isSelected) {
    if (isDarkMode) {
      styles.push(css`
        background-color: #ffffff30;
      `);
    } else {
      styles.push(css`
        background-color: #7d7d7d42;
      `);
    }
  }

  return styles;
});

export const darkMode = css`
  :root {
    background-color: #000;
    color: white;
    ${buttonDarkMode}
  }
`;

export const appStyle = [
  css`
    :root {
      font-family: ${fontFamily};
      font-weight: normal;
    }
    * {
      margin: 0;
      padding: 0;
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

    @media (prefers-color-scheme: dark) {
      ${darkMode}
    }
  `,
  shevyStyle,
];
