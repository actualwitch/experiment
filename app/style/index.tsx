import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { tryShevy } from "~/shevy";

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

      ul,
      ol {
        list-style: none;
        margin-bottom: 0;
      }
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
