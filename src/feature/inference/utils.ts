import { match } from "ts-pattern";
import { newLine } from "../../const";
import type { Message } from "../../types";
import { createXMLContextFromFiles, iterateDir } from "../../utils/context";
import { modelLabels } from "./types";
import { identity } from "../../utils/identity";

export const createAssistantResponse = (
  params: { role: "assistant"; name?: string } | { role: "tool" } = { role: "assistant" },
): Message => ({
  ...params,
  fromServer: true,
  content: "",
  timestamp: new Date().toISOString(),
});

export async function materializeExperiment(experiment: Message[], enforceDialogueFlow = false) {
  const messages: Message[] = [];
  for (const message of experiment) {
    const thisMessage = await match(message)
      .with({ role: "assistant" }, (message) => {
        const { name, pronouns } = message;
        const identity = pronouns ? `${name} (${pronouns})` : name;
        if (identity && !Object.keys(modelLabels).includes(identity))
          return {
            role: "assistant" as const,
            content: identity ? `${identity}:${newLine}${newLine}${message.content}` : message.content,
          };
        return {
          role: "assistant" as const,
          content: message.content,
        };
      })
      .with({ role: "user" }, (message) => {
        const { name, pronouns } = message;
        const identity = pronouns ? `${name} (${pronouns})` : name;
        return {
          role: "user" as const,
          content: identity ? `${identity}:${newLine}${newLine}${message.content}` : message.content,
        };
      })
      .with({ role: "context" }, async ({ content: { directory } }) => {
        const files = await iterateDir(directory);
        const context = await createXMLContextFromFiles(files, directory);
        return { role: "user" as const, content: context };
      })
      .otherwise(identity);
    if (enforceDialogueFlow && thisMessage.role === messages.at(-1)?.role) {
      const lastMessage = messages.pop()!;
      if (typeof lastMessage.content === "string") {
        lastMessage.content += newLine + newLine + thisMessage.content;
      }
      messages.push(lastMessage);
    } else {
      messages.push(thisMessage);
    }
  }
  return messages;
}
