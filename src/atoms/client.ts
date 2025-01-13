import { atom } from "jotai";
import type { Message } from "./common";

export type ExperimentWithMeta = {
  id?: string;
  messages: Message[];
  timestamp?: string;
};

export const importsRegistry = atom<Record<string, Array<ExperimentWithMeta>>>({});

export const filenames = atom((get) => {
  const registry = get(importsRegistry);
  return Object.keys(registry);
});

export const selectedChat = atom<Array<string | number> | undefined>(undefined);

export const expandedChatIds = atom<string[]>([]);

export const iterateObject = (
  obj: any,
): Array<{ role: "system" | "user" | "assistant"; content?: string; tool_calls?: object[] }> | undefined => {
  if (!obj || typeof obj !== "object") return;
  if (obj.role && (obj.content || obj.tool_calls)) {
    return [obj];
  }
  if (Array.isArray(obj)) {
    const [first] = obj;
    if (first?.role && (first.content || first.tool_calls)) {
      return obj;
    }
    for (const item of obj) {
      iterateObject(item);
    }
  } else {
    for (const value of Object.values(obj)) {
      const result = iterateObject(value);
      if (result) return result;
    }
  }
};

export const processCsvAtom = atom(null, (get, set, file?: File) => {
  if (!file || file.type !== "text/csv") return;
  const fileName = file.name.slice(0, -4);
  const reader = new FileReader();
  reader.onload = async (e) => {
    const file = e.target?.result;
    if (!file) return;
    const { default: csv } = await import("csvtojson");
    const experiments: Array<ExperimentWithMeta> = [];
    const lines = await csv().fromString(file.toString());
    for (const line of lines) {
      let timestamp: string | null = null;
      let id: string | null = null;
      let thisExperiment: Message[] = [];
      for (const [key, value] of Object.entries(line)) {
        if (typeof value !== "string") continue;
        if (key === "id") {
          id = value;
          continue;
        }
        try {
          const obj = JSON.parse(value);
          const messages = iterateObject(obj);
          if (messages) {
            if (messages.some((m) => m.role === "assistant")) {
              for (const message of messages) {
                if (message.content) {
                  thisExperiment.push({ role: "assistant", content: message.content, fromServer: true });
                  continue;
                }
                if (message.tool_calls) {
                  for (const toolCall of message.tool_calls) {
                    thisExperiment.push({ role: "tool", fromServer: true, content: toolCall });
                  }
                }
              }
            } else {
              thisExperiment = [...messages, ...thisExperiment];
            }
          }
        } catch (e) {
          const d = new Date(value);
          if (!Number.isNaN(d.getTime())) {
            timestamp = value;
          }
        }
      }
      if (thisExperiment.length) {
        const exp: ExperimentWithMeta = { messages: thisExperiment };
        if (id !== null) {
          exp.id = id;
        }
        if (timestamp !== null) {
          exp.timestamp = timestamp;
        }
        experiments.push(exp);
      }
    }
    set(importsRegistry, (prev) => ({
      ...prev,
      [fileName]: experiments,
    }));
  };
  reader.readAsText(file);
});
