import { atom, useAtom } from "jotai";
import { useMemo } from "react";
import { Temporal } from "temporal-polyfill";

import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { View } from "../ui/view";
import { ChatPreview } from "./chat";

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
    if (meta.timestamp) {
      const instant = Temporal.Instant.from(meta.timestamp);
      const zoned = instant.toZonedDateTimeISO(timezone);
      meta.timestamp = zoned.toLocaleString(undefined, { timeStyle: "full", dateStyle: "full" });
    }
    return [
      {
        role: "info",
        content: meta,
      },
      ...messages,
    ];
  }, [experiment, timezone]);
  return <ChatPreview experiment={experimentWithMeta} />;
}
