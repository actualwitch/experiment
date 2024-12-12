import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import type { Message } from "../state/common";

export const experimentToOpenai = (experiment: Message[]): ChatCompletionCreateParams | null => {
  if (experiment.length === 0) {
    return null;
  }
  const messages: ChatCompletionMessageParam[] = [];
  const tools: ChatCompletionTool[] = [];
  for (const { role, content } of experiment) {
    if (role === "tool") {
      let thisTool = content;

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
  const result: ChatCompletionCreateParams = {
    messages,
    model: "gpt-4o",
    temperature: 0.0,
    max_tokens: 2048,
    stream: true,
  };
  if (tools.length) {
    result.tools = tools;
    result.tool_choice =
      tools.length === 1 ?
        {
          type: "function" as const,
          function: { name: tools[0].function.name },
        }
      : undefined;
  }
  return result;
};
