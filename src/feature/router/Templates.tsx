import { atom, useAtom, type Setter } from "jotai";

import { View } from "../../components/view";
import { SidebarInput } from "./navigation";
import { templatesAtom } from "../../atoms/common";
import { Actions, Page } from "./_page";
import { ConfigRenderer, type Config } from "../../components/ConfigRenderer";

const selectedTemplateAtom = atom<string | null>(null);

export const actionsAtom = atom((get) => {
  const templates = get(templatesAtom);
  const selectedTemplate = get(selectedTemplateAtom);
  let counter = 0;
  const config: Config = {
    Actions: [],
  };

  if (templates && selectedTemplate) {
    config.Actions.push({
      buttons: [
        {
          label: "Delete",
          action: (set: Setter) => {
            set(
              templatesAtom,
              Object.fromEntries(Object.entries(templates).filter(([name]) => name !== selectedTemplate)),
            );
            set(selectedTemplateAtom, null);
          },
        },
      ],
    });
    counter++;
  }

  return { config, counter };
});

export default function Templates() {
  const [templates, setTemplates] = useAtom(templatesAtom);
  const [selectedTemplate, setSelectedTemplate] = useAtom(selectedTemplateAtom);

  const [{ config, counter }] = useAtom(actionsAtom);
  return (
    <>
      <Page>
        <View>
          {templates ?
            selectedTemplate ?
              templates[selectedTemplate]
            : undefined
          : undefined}
        </View>
      </Page>
      <Actions>
        <ConfigRenderer>{config}</ConfigRenderer>
      </Actions>
      <SidebarInput>
        <ul>
          {templates &&
            Object.keys(templates).map((name) => (
              <li key={name}>
                <a onClick={() => void setSelectedTemplate(name)}>{name}</a>
              </li>
            ))}
        </ul>
      </SidebarInput>
    </>
  );
}
