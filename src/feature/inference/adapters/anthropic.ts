import type {
  MessageCreateParams,
  MessageCreateParamsNonStreaming,
  MessageParam,
  Model,
  Tool,
} from "@anthropic-ai/sdk/resources/index.mjs";
import { newLine, tokenLimit } from "../../../const";
import { StringType, type ExperimentFunction, type Message } from "../../../types";
import { createXMLContextFromFiles, iterateDir } from "../../../utils/context";
import { experimentFunctionToAnthropicTool, tryParseFunctionSchema } from "../function";
import type { InferenceConfig } from "../types";

export async function experimentToAnthropic(
  experiment: Message[],
  config: InferenceConfig,
): Promise<MessageCreateParams> {
  let system = "";
  const messages: MessageParam[] = [];
  const tools: Tool[] = [];
  for (const { role, content, fromServer, name, pronouns } of experiment) {
    if (role === "context") {
      const directory = content.directory as string;
      const files = await iterateDir(directory);
      const context = await createXMLContextFromFiles(files, directory);
      messages.push({ role: "user", content: context });
      continue;
    }
    if (role === "system") {
      system += `${content}${newLine}`;
      continue;
    }
    if (role === "user" && typeof content === "string") {
      const message = { role, content };
      const identity = pronouns ? `${name} (${pronouns})` : name;
      message.content = identity ? `${identity}:${newLine}${message.content}` : message.content;
      messages.push(message);
      continue;
    }
    if (role === "assistant") {
      messages.push({ role, content: typeof content === "object" ? JSON.stringify(content) : content });
      continue;
    }
    if (role === "tool" && !fromServer) {
      if (typeof content === "object" && content !== null) {
        const tool = tryParseFunctionSchema(content as Record<string, unknown>).unwrapOr(content as ExperimentFunction);
        tools.push(experimentFunctionToAnthropicTool(tool));
      }
    }
  }
  const tool_choice = tools.length === 1 ? { type: "tool" as const, name: tools[0].name } : undefined;
  return {
    system,
    messages,
    tools,
    tool_choice,
    max_tokens: config.n_tokens,
    model: config.model,
    temperature: config.temperature,
    stream: true,
  };
}
