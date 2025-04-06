import styled from "@emotion/styled";

export const increaseSpecificity = (amount = 2) => new Array(amount).fill("&").join("");

export const widen = (align: string, length: string) => `
padding-${align}: ${length};
margin-${align}: -${length};
`;

export const Underline = styled.span`
  text-decoration: underline;
`;
