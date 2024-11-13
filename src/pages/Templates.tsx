import { useAtom } from "jotai";
import { templatesAtom } from "../state/common";
import { View } from "../components/view";
import { SidebarInput } from "../navigation";
import { useState } from "react";
import { Sidebar } from "../style";

export default function Templates() {
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
      <Sidebar>
        <h2>Actions</h2>
        {selectedTemplate && (
          <button
            type="button"
            onClick={() => {
              setTemplates(Object.fromEntries(Object.entries(templates).filter(([name]) => name !== selectedTemplate)));
              setSelectedTemplate(null);
            }}
          >
            Delete
          </button>
        )}
      </Sidebar>
      <SidebarInput>
        <ul>
          {templates &&
            Object.keys(templates).map(name => (
              <li key={name}>
                <a onClick={() => void setSelectedTemplate(name)}>{name}</a>
              </li>
            ))}
        </ul>
      </SidebarInput>
    </>
  );
}
