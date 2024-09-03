import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { tryShevy } from "~/shevy";

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = tryShevy();
const shevyStyle = { body, h1, h2, h3, h4, h5, h6, ["p, ol, ul, pre"]: content };

export const darkMode = css`
  body {
    background-color: oklab(14.1% 0.014 0.045);
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

    @media (prefers-color-scheme: dark) {
      ${darkMode}
    }
  `,
  shevyStyle,
];

export const Container = styled.div(
  content,
  css`
    padding: ${bs()};
    margin-bottom: ${bs(2)};
    display: grid;
    grid-template-columns: 320px 1fr 400px;
    gap: ${bs()};
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
