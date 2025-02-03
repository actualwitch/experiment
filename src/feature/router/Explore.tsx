import { type Setter, atom, useAtom } from "jotai";
import { useEffect } from "react";

import { navigateAtom, titleOverrideAtom } from ".";
import templates from "../../../fixtures/templates.json";
import { filenames, importsRegistry, selectedChat } from "../../atoms/client";
import { experimentAtom, isNavPanelOpenAtom, layoutAtom, templatesAtom } from "../../atoms/common";
import { type Config, ConfigRenderer } from "../../components/ConfigRenderer";
import { View } from "../../components/view";
import type { ExperimentWithMeta } from "../../types";
import { ExperimentPreview } from "../chat/ExperimentPreview";
import { selectionAtom } from "../chat/chat";
import { Actions } from "../ui/Actions";
import { DesktopOnly } from "../ui/Mobile";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";

const SidebarContents = () => {
  const [chats] = useAtom(filenames);
  const [registry] = useAtom(importsRegistry);
  const [_, setSelectedChat] = useAtom(selectedChat);
  const entries = chats.reduce((acc, chatId) => {
    acc[chatId] = registry[chatId].map((chat, idx) => chat.id ?? `Experiment ${idx}`);
    return acc;
  }, {} as any);
  if (chats.length === 0) {
    return null;
  }
  return (
    <View
      onClick={(value, key, path) => {
        const [parent] = path;
        setSelectedChat([parent, key!]);
      }}
    >
      {entries}
    </View>
  );
};
export default function () {

  const title = "Explore";
  const [titleOverride, setTitleOverride] = useAtom(titleOverrideAtom);

  useEffect(() => {
    setTitleOverride(title);
    return () => setTitleOverride(null);
  }, []);

  return (
    <>
      <Page>
      </Page>
      {/* <Actions>
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions> */}
      <SidebarInput>
        <SidebarContents />
      </SidebarInput>
    </>
  );
}
