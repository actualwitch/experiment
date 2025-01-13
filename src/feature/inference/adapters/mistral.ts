import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import type { Message } from "../../../atoms/common";

export const experimentToMistral = (experiment: Message[]): ChatCompletionStreamRequest => {
  const messages: ChatCompletionStreamRequest["messages"] = [];
  const tools: ChatCompletionStreamRequest["tools"] = [];
  for (const { role, content } of experiment) {
    if (role === "tool") {
      const thisTool = content;

      if (typeof thisTool === "object") {
        tools.push(thisTool as any);
      }
      continue;
    }
    if (typeof content === "string") {
      messages.push({ role, content });
    }
    if (typeof content === "object") {
      messages.push({ role: "user", content: JSON.stringify(content) });
    }
  }
  const result: ChatCompletionStreamRequest = {
    messages,
    model: "mistral-small-latest",
    temperature: 0.0,
    maxTokens: 2048,
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
