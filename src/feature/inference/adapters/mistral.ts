import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import type { ExperimentFunction, Message } from "../../../types";
import { experimentFunctionToTool, tryParseFunctionSchema } from "../function";
import type { InferenceConfig } from "../types";

export const experimentToMistral = (
  experiment: Message[],
  { n_tokens, model, temperature }: InferenceConfig,
): ChatCompletionStreamRequest => {
  const messages: ChatCompletionStreamRequest["messages"] = [];
  const tools: ChatCompletionStreamRequest["tools"] = [];
  for (const { role, content, fromServer, name, pronouns } of experiment) {
    if (role === "tool") {
      if (!fromServer && typeof content === "object" && content !== null) {
        const tool = tryParseFunctionSchema(content as Record<string, unknown>).unwrapOr(content as ExperimentFunction);
        tools.push(experimentFunctionToTool(tool));
        continue;
      }
    }
    if (["system", "user", "assistant"].includes(role)) {
      messages.push({ role, content });
      continue;
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
