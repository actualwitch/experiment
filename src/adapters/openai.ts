import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/index.mjs";
import type { Message } from "../state/common";
import { makeRequestTool } from "../state/inference";

function isUserOrAssistant(role: string): role is "user" | "assistant" {
  return ["user", "assistant"].includes(role);
}

export const experimentToOpenai = (experiment: Message[]): ChatCompletionCreateParams | null => {
  if (experiment.length === 0) {
    return null;
  }
  const messages: ChatCompletionMessageParam[] = [];
  const tools: ChatCompletionTool[] = [];
  for (const { role, content } of experiment) {
    if (isUserOrAssistant(role)) {
      if (typeof content === "string") {
        messages.push({ role, content });
      }
      if (typeof content === "object") {
        messages.push({ role: "user", content: JSON.stringify(content) });
      }
    }
    if (role === "tool") {
      let thisTool = content;

      if (typeof thisTool === "object") {
        tools.push(thisTool as any);
      }
    }
  }
  const result: ChatCompletionCreateParams = {
    messages,
    model: "gpt-4o-mini",
    temperature: 0.0,
    max_tokens: 256,
    stream: true,
  };
  if (tools.length) {
    result.tools = tools;
    result.tool_choice =
      tools.length === 1 ? { type: "function" as const, function: { name: tools[0].function.name } } : undefined;
  }
  return result;
};
