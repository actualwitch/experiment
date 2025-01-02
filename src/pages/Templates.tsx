import { useAtom } from "jotai";
import { useState } from "react";

import { View } from "../components/view";
import { SidebarInput } from "../navigation";
import { templatesAtom } from "../state/common";
import { Button } from "../style";
import { Actions, Page } from "./_page";

export default function Templates() {
  const [templates, setTemplates] = useAtom(templatesAtom);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
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
        <h3>Actions</h3>
        {templates && selectedTemplate && (
          <Button
            type="button"
            onClick={() => {
              setTemplates(Object.fromEntries(Object.entries(templates).filter(([name]) => name !== selectedTemplate)));
              setSelectedTemplate(null);
            }}
          >
            Delete
          </Button>
        )}
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
