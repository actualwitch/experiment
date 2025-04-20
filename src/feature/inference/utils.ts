import type { Message } from "../../types";

export const createAssistantResponse = (
  params: { role: "assistant"; name?: string } | { role: "tool" } = { role: "assistant" },
): Message => ({
  ...params,
  fromServer: true,
  content: "",
  timestamp: new Date().toISOString(),
});
