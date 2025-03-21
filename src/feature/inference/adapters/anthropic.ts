import type {
  MessageCreateParams,
  MessageCreateParamsNonStreaming,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/index.mjs";
import { tokenLimit } from "../../../const";
import type { ExperimentFunction, Message } from "../../../types";
import { createXMLContextFromFiles, iterateDir } from "../../../utils/context";
import { experimentFunctionToAnthropicTool, tryParseFunctionSchema } from "../function";

export async function experimentToAnthropic(
  experiment: Message[],
  { max_tokens = tokenLimit }: { max_tokens?: number } = {},
): Promise<MessageCreateParams | MessageCreateParamsNonStreaming> {
  let system = "";
  const messages: MessageParam[] = [];
  const tools: Tool[] = [];
  for (const { role, content, fromServer } of experiment) {
    if (role === "system") {
      system += `${content}
`;
      continue;
    }
    if (role === "user" || role === "assistant") {
      if (typeof content === "object") {
        messages.push({ role, content: JSON.stringify(content) });
      }
      if (typeof content === "string") {
        messages.push({ role, content });
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
    model: "claude-3-5-haiku-20241022",
    temperature: 0.0,
    max_tokens,
    stream: true,
  };
}
