import styled from "@emotion/styled";
import { css } from "@emotion/react";
import type { PropsWithChildren } from "react";
import { useAtom } from "jotai";

import { bs, Sidebar, Slideover } from "../../style";
import type { WithDarkMode } from "../../style/darkMode";
import { Palette } from "../../style/palette";
import { increaseSpecificity } from "../../style/utils";
import { isActionPanelOpenAtom, isDarkModeAtom, layoutAtom, type WithLayout } from "../../atoms/common";
import { withOnMobile } from "../../style/layout";
import { DesktopOnly } from "../../components/Mobile";

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

export const Actions = ({ children, from = "left" }: PropsWithChildren<{ from?: "left" | "right" }>) => {
  const [layout] = useAtom(layoutAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isActionsPanelOpen, setIsActionPanelOpened] = useAtom(isActionPanelOpenAtom);
  if (layout === "mobile") {
    return (
      <Slideover isOpen={isActionsPanelOpen} isDarkMode={isDarkMode} from={from}>
        <Sidebar>{children}</Sidebar>
      </Slideover>
    );
  }
  return (
    <DesktopOnly>
      <Sidebar>{children}</Sidebar>
    </DesktopOnly>
  );
};
