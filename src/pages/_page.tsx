import styled from "@emotion/styled";

import { bs } from "../style";
import { type WithDarkMode } from "../style/darkMode";
import { Palette } from "../style/palette";
import { increaseSpecificity } from "../style/utils";
import { isDarkModeAtom, layoutAtom, type WithLayout } from "../state/common";
import { css } from "@emotion/react";
import type { PropsWithChildren } from "react";
import { useAtom } from "jotai";

export const PageContainer = styled.div<WithDarkMode & WithLayout>`
  display: flex;
  flex-direction: column;
  padding: ${bs()};
  ${increaseSpecificity()} {
    overflow-x: hidden;
  }
  a {
    color: ${Palette.pink};
    text-decoration: underline;
    cursor: pointer;
    :hover {
      color: ${Palette.purple};
    }
  }
  ${(p) =>
    p.layout === "mobile" &&
    css`
      padding-top: 80px;
    `}
`;

export const Page = ({ children }: PropsWithChildren) => {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [layout] = useAtom(layoutAtom);
  return (
    <PageContainer isDarkMode={isDarkMode} layout={layout}>
      {children}
    </PageContainer>
  );
};
