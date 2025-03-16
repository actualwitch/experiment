import type { Maybe } from "true-myth";
import type { ExperimentFunction } from "../../types";
import { just, nothing } from "true-myth/maybe";
import type { ChatCompletionTool } from "openai/resources/chat/completions.mjs";
import type { Tool } from "@anthropic-ai/sdk/resources/index.mjs";

export const tryParseFunctionSchema = (input: Record<string, unknown>): Maybe<ExperimentFunction> => {
  // openai/mistral format
  if (input.type === "function" && typeof input.function === "object" && input.function !== null) {
    const name = (input.function as Record<string, unknown>).name;
    const description = (input.function as Record<string, unknown>).description;
    const schema = (input.function as Record<string, unknown>).parameters;
    if (typeof name === "string" && typeof description === "string" && typeof schema === "object" && schema !== null) {
      return just({ name, description, schema: schema as Record<string, unknown> });
    }
  }
  // anthropic format
  const { name, description, input_schema: schema } = input;
  if (typeof name === "string" && typeof description === "string" && typeof schema === "object" && schema !== null) {
    return just({ name, description, schema: schema as Record<string, unknown> });
  }
  return nothing();
};

export const experimentFunctionToTool = ({ name, description, schema }: ExperimentFunction): ChatCompletionTool => {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: schema,
    },
  };
};

export const experimentFunctionToAnthropicTool = ({ name, description, schema }: ExperimentFunction): Tool => {
  return {
    name,
    description,
    input_schema: schema,
  };
};
