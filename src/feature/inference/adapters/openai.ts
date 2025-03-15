import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { type Message, ObjectOrStringType, StringType } from "../../../types";
import { createXMLContextFromFiles, iterateDir } from "../../../utils/context";

export const experimentToOpenai = async (experiment: Message[]): Promise<ChatCompletionCreateParams> => {
  const messages: ChatCompletionMessageParam[] = [];
  const tools: ChatCompletionTool[] = [];
  for (const { role, content, fromServer } of experiment) {
    if (role === "tool" && !fromServer) {
      const thisTool = content;

      if (typeof thisTool === "object") {
        tools.push(thisTool as any);
      }
      continue;
    }
    if (role === "context") {
      const directory = content.directory as string;
      const files = await iterateDir(directory);
      const context = await createXMLContextFromFiles(files, directory);
      messages.push({ role: "user", content: context });
      continue;
    }
    if (typeof content === "string" && StringType.guard(role)) {
      messages.push({ role, content });
      continue;
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
