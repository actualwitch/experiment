import type { Setter } from "jotai";
import { Ban, Copy, Disc3, GitBranchPlus } from "lucide-react";

import { type Path, type Store, experimentAtom, parentAtom, selectionAtom, templatesAtom } from "../../../atoms/common";
import type { Experiment, Message } from "../../../types";

export const createTemplateButton = (templates: Store["templates"], content: Message) => ({
  label: "Template",
  icon: Disc3,
  action: async (set: Setter) => {
    const name = prompt("Name of the template");
    if (!name) return;
    set(templatesAtom, { ...templates, [name]: content });
  },
});

export const createSelectionEditButtons = (templates: Store["templates"], content: Message) => {
  return [
    {
      label: "Copy",
      icon: Copy,
      action: (set: Setter) => void navigator.clipboard.writeText(content.content.toString()),
    },
    createTemplateButton(templates, content),
    {
      label: "Unselect",
      icon: Ban,
      action: (set: Setter) => set(selectionAtom, []),
    },
  ];
};

export const createCancelEditingButton = (newSelection: Path) => ({
  label: "Cancel",
  icon: Ban,
  action: (set: Setter) => set(selectionAtom, newSelection),
});

export const createRemixButtons = (
  experiment: Experiment,
  parent?: string,
  navigate?: null | ((path: string) => void),
) => {
  return [
    {
      label: "Fork",
      icon: GitBranchPlus,
      action: (set: Setter) => {
        if (!experiment) return;
        const messages = Array.isArray(experiment) ? experiment : experiment.messages;
        set(experimentAtom, messages);
        if (parent) set(parentAtom, parent);
        navigate?.("/");
      },
    },
    {
      label: "Copy",
      icon: Copy,
      action: (set: Setter) => void navigator.clipboard.writeText(JSON.stringify(experiment)),
    },
  ];
};
