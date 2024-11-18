import Anthropic from "@anthropic-ai/sdk";
import { atom } from "jotai";
import OpenAI from "openai";
import { experimentToAnthropic } from "../adapters/anthropic";
import { experimentToOpenai } from "../adapters/openai";
import { markdownTest } from "../fixtures";
import { maybeImport } from "../utils";
import { entangledAtom } from "../utils/entanglement";
import { type Message, createExperiment, experimentAtom, tokensAtom } from "./common";
import makeRequestTool from "./makeRequestTool.json";
import { store } from "./store";

export { makeRequestTool };

export const toolsAtom = atom([makeRequestTool]);

export type InferenceProvider = "anthropic" | "openai";
export type OpenAiModel = "gpt-4o" | "gpt-4o-mini";

export const resolvedTokensAtom = atom<Promise<{ anthropic?: string; openai?: string }>>(async (get) => {
  const references = get(tokensAtom);
  const result: { anthropic?: string; openai?: string } = {};
  if (!references) return result;
  const [anthropic, openai] = await Promise.all(
    [references.anthropic, references.openai].map(async (ref) => {
      if (!ref) return null;
      const { spawn } = await maybeImport("child_process");
      if (!spawn) return null;
      const handle = spawn("op", ["read", ref]);
      return await new Promise<string | null>((ok, ko) => {
        handle.stdout.on("data", (data: unknown) => {
          ok(String(data).trim());
        });

        handle.stderr.on("data", (data: unknown) => {
          console.error(String(data));
        });

        handle.on("close", () => {
          ok(null);
        });
      });
    }),
  );
  if (anthropic) result.anthropic = anthropic;
  if (openai) result.openai = openai;
  return result;
});

export const hasResolvedTokenAtom = entangledAtom(
  "has resolved tokens",
  atom(async (get) => {
    const { anthropic, openai } = await get(resolvedTokensAtom);
    return {
      anthropic: !!anthropic,
      openai: !!openai,
    };
  }),
);

const saveExperimentAtom = entangledAtom(
  { name: "save-experiment" },
  atom(null, async (get, set) => {
    const experiment: Message[] = get(experimentAtom);
    if (!experiment.length) return;
    set(createExperiment, experiment);
  }),
);

export const testStreaming = entangledAtom(
  { name: "test-streaming" },
  atom(null, async (get, set) => {
    const experiment = get(experimentAtom);

    let index = 0;
    const int = setInterval(() => {
      console.log("looping", index);
      if (index >= markdownTest.length) {
        clearInterval(int);
        set(saveExperimentAtom);
        return;
      }
      const advanceBy = 1;
      index += advanceBy;
      set(experimentAtom, [
        ...experiment,
        {
          role: "assistant",
          fromServer: true,
          content: markdownTest.slice(0, index),
        },
      ]);
    }, 10);
  }),
);

export const runExperimentAsAnthropic = entangledAtom(
  { name: "run-experiment-anthropic" },
  atom(null, async (get, set) => {
    const resolvedTokens = await store.get(resolvedTokensAtom);
    const experiment = get(experimentAtom);

    if (!resolvedTokens.anthropic || !experiment) return;

    const { stream, ...experimentAsAnthropic } = experimentToAnthropic(experiment);

    const anthropic = new Anthropic({ apiKey: resolvedTokens.anthropic });
    if (stream) {
      const stream = await anthropic.messages.create({
        ...experimentAsAnthropic,
        stream: true,
      });
      const contentBlocks: Message[] = [];
      for await (const messageStreamEvent of stream) {
        if (messageStreamEvent.type === "content_block_start") {
          contentBlocks.push({
            role: messageStreamEvent.content_block.type === "text" ? "assistant" : "tool",
            fromServer: true,
            content: "",
          });
        }
        if (messageStreamEvent.type === "content_block_delta") {
          const block = contentBlocks[messageStreamEvent.index];
          if (block && messageStreamEvent.delta.type === "text_delta") {
            block.content += messageStreamEvent.delta.text;
          }
          if (block && messageStreamEvent.delta.type === "input_json_delta") {
            block.content += messageStreamEvent.delta.partial_json;
          }
        }

        set(experimentAtom, [...experiment, ...contentBlocks]);
      }
      set(saveExperimentAtom);
    } else {
      const response = await anthropic.messages.create(experimentAsAnthropic);
      for (const contentBlock of response.content) {
        if (contentBlock.type === "text") {
          set(experimentAtom, (prev) => [...prev, { role: "assistant", fromServer: true, content: contentBlock.text }]);
        }
        if (contentBlock.type === "tool_use") {
          set(experimentAtom, (prev) => [...prev, { role: "tool", fromServer: true, content: contentBlock }]);
        }
      }
    }
  }),
);

export const runExperimentAsOpenAi = entangledAtom(
  { name: "run-experiment-openai" },
  atom(null, async (get, set) => {
    const resolvedTokens = await store.get(resolvedTokensAtom);
    const experiment = get(experimentAtom);

    if (!resolvedTokens.openai || !experiment) return;

    const experimentAsOpenai = experimentToOpenai(experiment);
    if (!experimentAsOpenai) return;

    const client = new OpenAI({ apiKey: resolvedTokens.openai });
    if (experimentAsOpenai.stream) {
      const stream = await client.chat.completions.create({
        ...experimentAsOpenai,
        stream: true,
      });
      const contentChunks: Message[] = [];
      for await (const chunk of stream) {
        if (chunk.choices.length === 0) {
          continue;
        }
        const choice = chunk.choices[0];
        if (choice.index !== contentChunks.length - 1) {
          contentChunks.push({
            role: "assistant",
            fromServer: true,
            content: "",
          });
        }
        contentChunks[choice.index].content += choice.delta.content ?? "";
        set(experimentAtom, [...experiment, ...contentChunks]);
      }
      set(saveExperimentAtom);
    }
  }),
);
