import { useAtom } from "jotai";
import { useState } from "react";

import { View } from "../components/view";
import { SidebarInput } from "../navigation";
import { layoutAtom, templatesAtom } from "../state/common";
import { Button, Sidebar } from "../style";

export default function Templates() {
  const [layout] = useAtom(layoutAtom);
  const [templates, setTemplates] = useAtom(templatesAtom);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  return (
    <>
      <View>
        {templates ?
          selectedTemplate ?
            templates[selectedTemplate]
          : undefined
        : undefined}
      </View>
      {layout === "desktop" && (
        <Sidebar>
          <h2>Actions</h2>
          {templates && selectedTemplate && (
            <Button
              type="button"
              onClick={() => {
                setTemplates(
                  Object.fromEntries(Object.entries(templates).filter(([name]) => name !== selectedTemplate)),
                );
                setSelectedTemplate(null);
              }}
            >
              Delete
            </Button>
          )}
        </Sidebar>
      )}
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
