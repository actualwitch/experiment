import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { type Message, StringType, ObjectOrStringType } from "../../../types";

export const experimentToOpenai = (experiment: Message[]): ChatCompletionCreateParams => {
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
    if (role !== "info" && ObjectOrStringType.guard(role)) {
      messages.push({ role, content: typeof content === "string" ? content : JSON.stringify(content) });
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
