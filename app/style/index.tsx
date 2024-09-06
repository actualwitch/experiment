import { css, SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";
import { tryShevy } from "~/shevy";

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = tryShevy();
const shevyStyle = { body, h1, h2, h3, h4, h5, h6, ["p, ol, ul, pre"]: content };

export const darkMode = css`
  body {
    background-color: #000;
    color: white;
  }
`;

export const appStyle = [
  css`
    body {
      font-family: Charter, "Bitstream Charter", "Sitka Text", Cambria, serif;
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

    input {
      font: inherit;
    }

    @media (prefers-color-scheme: dark) {
      ${darkMode}
    }
  `,
  shevyStyle,
];

export const Container = styled.div(
  content,
  css`
    margin-bottom: 0;
    display: grid;
    grid-template-columns: 278px 1fr 400px;
    gap: ${bs(2)};
    height: 100lvh;
    & > * {
      padding-top: ${bs()};
      padding-bottom: ${bs(4)};
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

export const Message = styled.article<{ role: "system" | "user" | "assistant" | "tool" | string }>(({ role }) => {
  const styles: SerializedStyles[] = [
    css`
      border-left: 4px solid transparent;

      position: relative;

      code {
        display: block;
        padding: ${bs(1 / 2)};
        padding-left: ${bs(1.5)};
      }

      &:before {
        content: "${role}";
        position: absolute;
        transform-origin: top left;
        transform: rotate(-90deg) translate(-120%)
      }
    `,
  ];
  if (role === "system") {
    styles.push(css`
      border-color: yellow;
    `);
  }
  if (role === "user") {
    styles.push(css`
      border-color: rebeccapurple;
    `);
  }
  if (role === "assistant") {
    styles.push(css`
      border-color: lightblue;
    `);
  }
  if (role === "tool") {
    styles.push(css`
      border-color: lightgreen;
    `);
  }
  return styles;
});
