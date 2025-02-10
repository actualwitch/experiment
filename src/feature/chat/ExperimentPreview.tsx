import { atom, useAtom } from "jotai";
import { useMemo } from "react";
import { Temporal } from "temporal-polyfill";

import { View } from "../ui/view";
import type { Experiment } from "../../types";
import { entangledAtom } from "../../utils/entanglement";
import { ChatPreview } from "./chat";

const timezoneAtom = entangledAtom(
  "tz",
  atom(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
);

export function ExperimentPreview({ experiment }: { experiment: Experiment }) {
  const [timezone] = useAtom(timezoneAtom);

  const meta = useMemo(() => {
    if (Array.isArray(experiment)) {
      return null;
    }
    const { messages, ...meta } = experiment;
    if (meta.timestamp) {
      const instant = Temporal.Instant.from(meta.timestamp);
      const zoned = instant.toZonedDateTimeISO(timezone);
      meta.timestamp = zoned.toLocaleString(undefined, { timeStyle: "full", dateStyle: "full" });
    }
    return meta;
  }, [experiment, timezone]);
  return (
    <>
      {meta && <View>{meta}</View>}
      <ChatPreview experiment={experiment} />
    </>
  );
}
