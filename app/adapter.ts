import type { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import type { Message } from "./state/common";

export const experimentToAnthropic = (experiment: Message[]) => {
  let system = "";
  const messages: MessageParam[] = [];
  for (const { role, content } of experiment) {
    if (role === "system") {
      system += content + "\n";
    }
    if (role === "user") {
      if (typeof content === "string") {
        messages.push({ role: "user", content });
      }
      if (typeof content === "object") {
        messages.push({ role: "user", content: JSON.stringify(content) });
      }
    }
  }
  return { system, messages };
};
