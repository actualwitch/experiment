import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { ObjectOrStringType, StringType, type Message } from "../state/common";

export const experimentToOpenai = (experiment: Message[]): ChatCompletionCreateParams | null => {
  if (experiment.length === 0) {
    return null;
  }
  const messages: ChatCompletionMessageParam[] = [];
  const tools: ChatCompletionTool[] = [];
  for (const { role, content } of experiment) {
    if (role === "tool") {
      const thisTool = content;

      if (typeof thisTool === "object") {
        tools.push(thisTool as any);
      }
      continue;
    }
    if (typeof content === "string" && StringType.guard(role)) {
      messages.push({ role, content });
    }
    if (typeof content === "object" && role !== "info" && ObjectOrStringType.guard(role)) {
      messages.push({ role, content: JSON.stringify(content) });
    }
  }
  const result: ChatCompletionCreateParams = {
    messages,
    model: "gpt-4o",
    temperature: 0.0,
    stream: true,
  };
  if (tools.length) {
    result.tools = tools;
    result.tool_choice = "auto";
  }
  return result;
};
