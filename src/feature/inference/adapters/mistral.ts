import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import { type Message, ObjectOrStringType, StringType } from "../../../types";
import { tokenLimit } from "../../../const";

export const experimentToMistral = (
  experiment: Message[],
  { maxTokens = tokenLimit }: { maxTokens?: number } = {},
): ChatCompletionStreamRequest => {
  const messages: ChatCompletionStreamRequest["messages"] = [];
  const tools: ChatCompletionStreamRequest["tools"] = [];
  for (const { role, content, fromServer } of experiment) {
    if (role === "tool" && !fromServer) {
      const thisTool = content;

      if (typeof thisTool === "object") {
        tools.push(thisTool as any);
      }
      continue;
    }
    if (typeof content === "string" && StringType.guard(role)) {
      messages.push({ role, content });
    }
    if (role !== "info" && ObjectOrStringType.guard(role)) {
      messages.push({ role, content: typeof content === "string" ? content : JSON.stringify(content) });
    }
  }
  const result: ChatCompletionStreamRequest = {
    messages,
    model: "mistral-small-latest",
    temperature: 0.0,
    maxTokens,
    stream: true,
  };
  if (tools.length) {
    result.tools = tools;
    result.toolChoice =
      tools.length === 1 ?
        {
          type: "function" as const,
          function: { name: tools[0].function.name },
        }
      : undefined;
  }
  return result;
};
