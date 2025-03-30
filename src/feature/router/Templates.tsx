import { type Setter, atom, useAtom } from "jotai";

import { navigateAtom } from ".";
import { templatesAtom } from "../../atoms/common";
import { experimentAtom } from "../../atoms/experiment";
import { ChatPreview, hasMessages } from "../chat/chat";
import type { Config } from "../ui/ConfigRenderer";
import { SidebarInput } from "../ui/Navigation";
import { Page } from "../ui/Page";
import { DesktopOnly } from "../ui/Mobile";

const selectedTemplateAtom = atom<string | null>(null);

const selectedExperimentAtom = atom((get) => {
  const templates = get(templatesAtom);
  const selectedTemplate = get(selectedTemplateAtom);
  if (templates !== undefined && selectedTemplate !== null) {
    const template = templates[selectedTemplate];
    if (template !== undefined) {
      if (hasMessages(template)) {
        return template.messages;
      }
      return [template];
    }
  }
  return [];
});

export const actionsAtom = atom((get) => {
  const experiment = get(experimentAtom);
  const templates = get(templatesAtom);
  const selectedTemplate = get(selectedTemplateAtom);
  const selectedExperiment = get(selectedExperimentAtom);
  const navigate = get(navigateAtom);
  let counter = 0;
  const config: Config = {
    Actions: [],
  };

  if (templates && selectedTemplate) {
    config.Actions.push({
      buttons: [
        {
          label: "Apply",
          action: (set: Setter) => {
            set(experimentAtom, [...experiment, ...selectedExperiment]);
            navigate?.("/");
          },
        },
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

  const [experiment] = useAtom(selectedExperimentAtom);

  const [{ config, counter }] = useAtom(actionsAtom);
  return (
    <>
      <Page>
        {experiment.length > 0 ? (
          <ChatPreview collapseTemplates={false} experiment={experiment} />
        ) : (
          <>
            <DesktopOnly>
              <h2>Templates</h2>
            </DesktopOnly>
            <p>
              Templates help you save and reuse common message patterns, prompts, and tool definitions for consistent
              experiments.
            </p>
            <p>
              <strong>How to use templates:</strong>
            </p>
            <ul>
              <li>Select a template from the sidebar to preview its content</li>
              <li>Use the "Apply" button to add the template to your current experiment</li>
              <li>Create new templates by selecting messages in an experiment and clicking "Template"</li>
            </ul>
            <p>
              {templates && Object.keys(templates).length > 0
                ? "Select a template from the sidebar to get started."
                : "You haven't created any templates yet. Create your first template by selecting a message in an experiment and clicking 'Template'."}
            </p>
          </>
        )}
      </Page>
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
