import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import { newLine, tokenLimit } from "../../../const";
import { type ExperimentFunction, type Message, ObjectOrStringType, StringType } from "../../../types";
import { createContextFromFiles, iterateDir } from "../../../utils/context";
import { experimentFunctionToTool, tryParseFunctionSchema } from "../function";
import type { InferenceConfig } from "../types";

export const experimentToMistral = async (
  experiment: Message[],
  { n_tokens, model, temperature }: InferenceConfig,
): Promise<ChatCompletionStreamRequest> => {
  const messages: ChatCompletionStreamRequest["messages"] = [];
  const tools: ChatCompletionStreamRequest["tools"] = [];
  for (const { role, content, fromServer, name, pronouns } of experiment) {
    if (role === "tool" && !fromServer) {
      if (typeof content === "object" && content !== null) {
        const tool = tryParseFunctionSchema(content as Record<string, unknown>).unwrapOr(content as ExperimentFunction);
        tools.push(experimentFunctionToTool(tool));
        continue;
      }
    }

    if (role === "context") {
      const directory = content.directory as string;
      const files = await iterateDir(directory);
      const context = await createContextFromFiles(files, directory);
      messages.push({ role: "user", content: context });
      continue;
    }
    if (typeof content === "string" && StringType.guard(role)) {
      const message = { role, content };
      if (role === "user") {
        const identity = pronouns ? `${name} (${pronouns})` : name;
        message.content = identity ? `${identity}:${newLine}${message.content}` : message.content;
      }
      messages.push(message);
      continue;
    }
    if (role !== "info" && ObjectOrStringType.guard(role)) {
      messages.push({ role, content: typeof content === "string" ? content : JSON.stringify(content) });
    }
  }
  const result: ChatCompletionStreamRequest = {
    messages,
    model,
    temperature,
    maxTokens: n_tokens,
    stream: true,
  };
  if (tools.length) {
    result.tools = tools;
    result.toolChoice =
      tools.length === 1
        ? {
            type: "function" as const,
            function: { name: tools[0].function.name },
          }
        : undefined;
  }
  return result;
};
