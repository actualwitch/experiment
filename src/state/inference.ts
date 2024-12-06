import Anthropic from "@anthropic-ai/sdk";
import { atom } from "jotai";
import OpenAI from "openai";
import { Literal, Union } from "runtypes";
import { experimentToAnthropic } from "../adapters/anthropic";
import { experimentToOpenai } from "../adapters/openai";
import { markdownTest } from "../fixtures";
import { maybeImport } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { type Message, type Store, createExperiment, experimentAtom, parentAtom, tokensAtom } from "./common";
import makeRequestTool from "./makeRequestTool.json";
import { store } from "./store";
import { getRealm, hasBackend } from "../utils/realm";

export { makeRequestTool };

export const toolsAtom = atom([makeRequestTool]);

export const OpenAIModel = Union(Literal("gpt-4o"), Literal("gpt-4o-mini"), Literal("o1-preview"), Literal("o1-mini"));
export const AnthropicModel = Union(Literal("claude-3-5-sonnet-latest"), Literal("claude-3-5-haiku-latest"));
export const MistralModel = Union(
  Literal("mistral-large-latest"),
  Literal("mistral-medium-latest"),
  Literal("mistral-small-latest"),
);

export const tempAtom = atom(0.0);

export const resolvedTokensAtom = divergentAtom(() => {
  return atom<Store["tokens"] | Promise<Store["tokens"]>>(async (get) => {
    const references = get(tokensAtom);
    const result: Store["tokens"] = {};
    if (!references) return result;
    const promises = Object.entries(references).map(async ([key, ref]) => {
      if (!ref) return [key, null];
      if (ref.startsWith("op:")) {
        const { spawn } = await maybeImport("child_process");
        if (!spawn) return [key, null];
        const handle = spawn("op", ["read", ref]);
        const token = await new Promise<string | null>((ok, ko) => {
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
        return [key, token];
      }
      return [key, null];
    });
    const resolved = await Promise.all(promises);
    for (const [key, value] of resolved) {
      result[key] = value;
    }
    return result;
  });
});

export const hasResolvedTokenAtom = entangledAtom(
  "has resolved tokens",
  atom(async (get) => {
    const { anthropic, openai, mistral } = await get(resolvedTokensAtom);
    return {
      anthropic: !!anthropic,
      mistral: !!mistral,
      openai: !!openai,
    };
  }),
);

const saveExperimentAtom = entangledAtom(
  { name: "save-experiment" },
  atom(null, async (get, set) => {
    const experiment: Message[] = get(experimentAtom);
    const parent = get(parentAtom);
    if (!experiment.length) return;
    set(createExperiment, experiment, parent ?? undefined);
  }),
);

export const testStreaming = entangledAtom(
  { name: "test-streaming" },
  atom(null, async (get, set) => {
    const experiment = get(experimentAtom);

    let index = 0;
    const int = setInterval(() => {
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

    const anthropic = new Anthropic({
      apiKey: resolvedTokens.anthropic,
      dangerouslyAllowBrowser: hasBackend() ? undefined : true,
    });
    if (stream) {
      const stream = await anthropic.messages.create({
        ...experimentAsAnthropic,
        stream: true,
        temperature: get(tempAtom),
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
    const resolvedTokens = await get(resolvedTokensAtom);
    const experiment = get(experimentAtom);

    if (!resolvedTokens.openai || !experiment) {
      console.error("No openai token");
      return;
    }

    const experimentAsOpenai = experimentToOpenai(experiment);
    if (!experimentAsOpenai) return;

    const client = new OpenAI({
      apiKey: resolvedTokens.openai,
      dangerouslyAllowBrowser: hasBackend() ? undefined : true,
    });
    if (experimentAsOpenai.stream) {
      const stream = await client.chat.completions.create({
        ...experimentAsOpenai,
        stream: true,
        temperature: get(tempAtom),
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
