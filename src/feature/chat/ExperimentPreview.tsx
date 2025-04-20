import { atom, useAtom } from "jotai";
import { useMemo } from "react";
import { Temporal } from "temporal-polyfill";

import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { View } from "../ui/view";
import { ChatPreview } from "./chat";
import { DateTime } from "luxon";
import { modelLabels } from "../inference/types";

export const timezoneAtom = entangledAtom(
  "tz",
  atom(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
);

export function ExperimentPreview({ experiment }: { experiment: Experiment }) {
  const [timezone] = useAtom(timezoneAtom);

  const experimentWithMeta: Experiment = useMemo(() => {
    if (Array.isArray(experiment)) {
      return experiment;
    }
    const { messages, ...meta } = experiment;
    const timestamp = meta.timestamp;
    let name: string | undefined;
    if (meta.model) {
      name = modelLabels[meta.model] || meta.model;
    }
    const lastUserIdx = messages.findLastIndex((m) => !m.fromServer);
    if (lastUserIdx === -1) return messages;
    return messages.map((message, index) => (index > lastUserIdx ? { ...message, name, timestamp } : message));
  }, [experiment, timezone]);
  return <ChatPreview experiment={experimentWithMeta} />;
}
