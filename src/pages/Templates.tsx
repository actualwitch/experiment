import { useAtom } from "jotai";
import { templatesAtom } from "../state/common";
import { View } from "../components/view";
import { SidebarInput } from "../navigation";
import { useState } from "react";

export default function Templates() {
  const [templates] = useAtom(templatesAtom);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  return (
    <>
      <View>{selectedTemplate && templates ? templates[selectedTemplate] : []}</View>
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
