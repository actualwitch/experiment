import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import type { ExperimentFunction, Message } from "../../../types";
import { experimentFunctionToTool, tryParseFunctionSchema } from "../function";
import { type InferenceConfig, isReasoningEffortSupported, isReasoningModel } from "../types";

export const experimentToOpenai = (
  experiment: Message[],
  { model, temperature, n_tokens, reasoningEffort }: InferenceConfig,
): ChatCompletionCreateParams => {
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
    if (role === "user") {
      messages.push({ role, content });
      continue;
    }
    if (role === "assistant") {
      messages.push({ role, content: typeof content === "string" ? content : JSON.stringify(content) });
      continue;
    }
    if (role === "system") {
      const thisRole = model.includes("o1") ? "developer" : role;
      messages.push({ role: thisRole, content });
      continue;
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
    params.max_completion_tokens = n_tokens;
    if (isReasoningEffortSupported(model)) {
      params.reasoning_effort = reasoningEffort;
    }
  } else {
    params.max_tokens = n_tokens;
  }
  return params;
};
