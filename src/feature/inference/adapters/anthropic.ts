import type { MessageCreateParams, MessageParam, Tool } from "@anthropic-ai/sdk/resources/index.mjs";
import { just, nothing } from "true-myth/maybe";
import { P, match } from "ts-pattern";
import { newLine } from "../../../const";
import type { ExperimentFunction, Message } from "../../../types";
import { experimentFunctionToAnthropicTool, tryParseFunctionSchema } from "../function";
import type { InferenceConfig } from "../types";

export function experimentToAnthropic(experiment: Message[], config: InferenceConfig): MessageCreateParams {
  let system = "";
  const tools: Tool[] = [];
  const messages = experiment.map((message) =>
    match(message)
      .with({ role: "system" }, ({ content }) => {
        system += `${content}${newLine}`;
        return nothing();
      })
      .with({ role: "user", content: P.string }, ({ role, content }) => {
        return just({
          role,
          content,
        });
      })
      .with({ role: "assistant", content: P._ }, ({ content }) => {
        return just({
          role: "assistant" as const,
          content: typeof content === "object" ? JSON.stringify(content) : content,
        });
      })
      .with({ role: "tool" }, ({ content, fromServer }) => {
        if (!fromServer && typeof content === "object" && content !== null) {
          const tool = tryParseFunctionSchema(content as Record<string, unknown>).unwrapOr(
            content as ExperimentFunction,
          );
          tools.push(experimentFunctionToAnthropicTool(tool));
        }
        return nothing();
      })
      .otherwise(() => nothing()),
  );
  return {
    system,
    messages: messages.reduce((acc, item) => {
      if (item.isJust) acc.push(item.value);
      return acc;
    }, [] as MessageParam[]),
    tools,
    max_tokens: config.n_tokens,
    model: config.model,
    temperature: config.temperature,
    stream: true,
  };
}
