import type {
  MessageCreateParams,
  MessageCreateParamsNonStreaming,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/index.mjs";
import type { Message } from "../state/common";
import type { makeRequestTool } from "../state/inference";

export const experimentToAnthropic = (experiment: Message[]): MessageCreateParams | MessageCreateParamsNonStreaming => {
  let system = "";
  const messages: MessageParam[] = [];
  const tools: Tool[] = [];
  for (const { role, content } of experiment) {
    if (role === "system") {
      system += content + "\n";
    }
    if (role === "user") {
      if (typeof content === "string") {
        messages.push({ role: "user", content });
      }
      if (typeof content === "object") {
        messages.push({ role: "user", content: JSON.stringify(content) });
      }
    }
    if (role === "tool") {
      const thisTool = content;

      if (typeof thisTool === "object") {
        const tool = thisTool as typeof makeRequestTool;
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
    max_tokens: 2048,
    stream: true,
  };
};
