import type { MessageCreateParams, MessageParam, Tool } from "@anthropic-ai/sdk/resources/index.mjs";
import { just, nothing } from "true-myth/maybe";
import { P, match } from "ts-pattern";
import { newLine } from "../../../const";
import { type ExperimentFunction, type Message } from "../../../types";
import { createXMLContextFromFiles, iterateDir } from "../../../utils/context";
import { experimentFunctionToAnthropicTool, tryParseFunctionSchema } from "../function";
import type { InferenceConfig } from "../types";

export async function experimentToAnthropic(
  experiment: Message[],
  config: InferenceConfig,
): Promise<MessageCreateParams> {
  let system = "";
  const tools: Tool[] = [];
  const messages = experiment.map((message) =>
    match(message)
      .with({ role: "system" }, ({ content }) => {
        system += `${content}${newLine}`;
        return nothing();
      })
      .with({ role: "user", content: P.string }, (message) => {
        const { name, pronouns } = message;
        const identity = pronouns ? `${name} (${pronouns})` : name;
        return just({
          role: "user" as const,
          content: identity ? `${identity}:${newLine}${message.content}` : message.content,
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
