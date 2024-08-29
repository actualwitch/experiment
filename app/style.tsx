import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { tryShevy } from "~/shevy";

export const { baseSpacing: bs, content, body, h1, h2, h3, h4, h5, h6 } = tryShevy();
const shevyStyle = { body, h1, h2, h3, h4, h5, h6, ["p, ol, ul, pre"]: content };

export const appStyle = [
  css`
    body {
      font-family: Charter, "Bitstream Charter", "Sitka Text", Cambria, serif;
      font-weight: normal;
    }
    body,
    p,
    dl,
    dd,
    blockquote,
    figure,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    listing,
    xmp,
    pre,
    plaintext,
    ul,
    menu,
    dir,
    ol,
    hr {
      margin: 0;
      padding: 0;
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
