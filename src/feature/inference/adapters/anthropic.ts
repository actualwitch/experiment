import type {
  MessageCreateParams,
  MessageCreateParamsNonStreaming,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/index.mjs";
import type { Message } from "../../../types";

export const experimentToAnthropic = (
  experiment: Message[],
  { max_tokens = 2048 }: { max_tokens?: number } = {},
): MessageCreateParams | MessageCreateParamsNonStreaming => {
  let system = "";
  const messages: MessageParam[] = [];
  const tools: Tool[] = [];
  for (const { role, content, fromServer } of experiment) {
    if (role === "system") {
      system += `${content}
`;
    }
    if (role === "user" || role === "assistant") {
      if (typeof content === "object") {
        messages.push({ role, content: JSON.stringify(content) });
      }
      if (typeof content === "string") {
        messages.push({ role, content });
      }
    }
    if (role === "tool" && !fromServer) {
      if (typeof content === "object") {
        const tool = content as any;
        tools.push({
          name: tool?.function?.name ?? "Unnamed tool",
          description: tool?.function?.description ?? "No description",
          input_schema: tool?.function?.parameters,
        });
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
};
