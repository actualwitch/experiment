import { useAtom } from "jotai";
import type { PropsWithChildren } from "react";

import { isActionPanelOpenAtom, isDarkModeAtom, layoutAtom } from "../../atoms/common";
import { Sidebar, Slideover } from "../../style";
import { DesktopOnly } from "./Mobile";

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
