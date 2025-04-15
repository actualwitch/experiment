import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { type ExperimentFunction, type Message, ObjectOrStringType, StringType } from "../../../types";
import { createXMLContextFromFiles, iterateDir } from "../../../utils/context";
import { experimentFunctionToTool, tryParseFunctionSchema } from "../function";
import { newLine } from "../../../const";
import type { ChatModel } from "openai/resources/chat/chat.mjs";
import { isReasoningEffortSupported, isReasoningModel, type InferenceConfig } from "../types";

export const experimentToOpenai = async (
  experiment: Message[],
  { model, temperature, n_tokens, reasoningEffort }: InferenceConfig,
): Promise<ChatCompletionCreateParams> => {
  const messages: ChatCompletionMessageParam[] = [];
  const tools: ChatCompletionTool[] = [];
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
      const context = await createXMLContextFromFiles(files, directory);
      messages.push({ role: "user", content: context });
      continue;
    }
    if (typeof content === "string" && StringType.guard(role)) {
      const message: ChatCompletionMessageParam = { role, content };
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
  const params: ChatCompletionCreateParams = {
    messages,
    model,
    temperature,
    stream: true,
    stream_options: {
      include_usage: true,
    },
  };
  if (tools.length) {
    params.tools = tools;
    params.tool_choice = "auto";
  }

  if (isReasoningModel(model)) {
    params.temperature = undefined;
    if (isReasoningEffortSupported(model)) {
      params.reasoning_effort = reasoningEffort;
    }
  }
  return params;
};
