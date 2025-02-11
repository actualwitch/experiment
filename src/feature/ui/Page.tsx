import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { useAtom } from "jotai";
import type { PropsWithChildren } from "react";

import { isDarkModeAtom, layoutAtom, type WithLayout } from "../../atoms/common";
import { bs } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { withOnMobile } from "../../style/layout";
import { Palette } from "../../style/palette";
import { increaseSpecificity } from "../../style/utils";

export const PageContainer = styled.div<WithDarkMode & WithLayout>`
  display: flex;
  flex-direction: column;
  padding: ${bs()};
  flex: 1;
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
    withOnMobile(
      p.layout,
      css`
        padding-top: 80px;
      `,
    )}
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
