import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import { atom } from "jotai";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { Literal, Union } from "runtypes";
import { experimentToAnthropic } from "../adapters/anthropic";
import { experimentToMistral } from "../adapters/mistral";
import { experimentToOpenai } from "../adapters/openai";
import { markdownTest } from "../fixtures";
import { maybeImport } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { getRealm, hasBackend } from "../utils/realm";
import { type Message, type Store, createExperiment, experimentAtom, parentAtom, tokensAtom } from "./common";
import { store } from "./store";



export function withIds<T extends string>(items: T[] | readonly T[]) {
  return items.map((name) => ({
    id: name,
    name,
  }));
}
export const providerTypes = ["anthropic", "mistral", "openai"] as const;
export type ProviderType = (typeof providerTypes)[number];
export const providers = withIds(providerTypes);
export const providerLabels = {
  anthropic: "Anthropic",
  mistral: "Mistral",
  openai: "OpenAI",
} satisfies { [K in ProviderType]: string };

export const availableProvidersAtom = atom<ProviderType[]>(get => {
  const tokens = get(tokensAtom);
  return Object.keys(tokens) as ProviderType[];
});

export const selectedProviderAtom = entangledAtom("selected-provider", atom<ProviderType | undefined>(undefined));

export const OpenAIModel = Union(Literal("gpt-4o"), Literal("gpt-4o-mini"), Literal("o1-preview"), Literal("o1-mini"));
export const AnthropicModel = Union(Literal("claude-3-5-sonnet-latest"), Literal("claude-3-5-haiku-latest"));
export const MistralModel = Union(
  Literal("mistral-large-latest"),
  Literal("mistral-medium-latest"),
  Literal("mistral-small-latest"),
);

export const modelOptions = {
  openai: OpenAIModel.alternatives.map((model) => model.value),
  anthropic: AnthropicModel.alternatives.map((model) => model.value),
  mistral: MistralModel.alternatives.map((model) => model.value),
};

export const tempAtom = entangledAtom("temp", atom(0.0));
export const modelAtom = entangledAtom("model", atom<string>(""));
export const isRunningAtom = entangledAtom("is running", atom(false));

export const modelSupportsTemperatureAtom = atom(get => {
  const provider = get(selectedProviderAtom);
  const model = get(modelAtom);
  if (provider === "openai" && ["o1-mini", "o1-preview"].includes(model)) {
    return false;
  }
  return true;
})

export const resolvedTokensAtom = divergentAtom(() => {
  return atom<Store["tokens"] | Promise<Store["tokens"]>>(async (get) => {
    const references = get(tokensAtom);
    const result: Store["tokens"] = {};
    if (!references) return result;
    if (["spa", "testing"].includes(getRealm())) {
      return references;
    }
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

const saveExperimentAtom = entangledAtom(
  { name: "save-experiment" },
  atom(null, async (get, set) => {
    const experiment: Message[] = get(experimentAtom);
    const parent = get(parentAtom);
    if (!experiment.length) return;
    set(createExperiment, experiment, parent ?? undefined);
  }),
);

export const runInferenceAtom = entangledAtom(
  { name: "run-inference" },
  atom(null, async (get, set) => {
    const provider = get(selectedProviderAtom);
    if (!provider) return;

    switch (provider) {
      case "anthropic":
        return set(runExperimentAsAnthropic);
      case "openai":
        return set(runExperimentAsOpenAi);
      case "mistral":
        return set(runExperimentAsMistral);
    }
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
    set(isRunningAtom, true);

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
        model: get(modelAtom) ?? "claude-3-5-sonnet-latest",
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
    set(saveExperimentAtom);
    set(isRunningAtom, false);
  }),
);

export const runExperimentAsOpenAi = entangledAtom(
  { name: "run-experiment-openai" },
  atom(null, async (get, set) => {
    const resolvedTokens = await get(resolvedTokensAtom);
    const experiment = get(experimentAtom);
    set(isRunningAtom, true);

    if (!resolvedTokens.openai) {
      console.error("No openai token");
      return;
    }
    if (!experiment || experiment.length === 0) {
      console.error("No experiment");
      return;
    }

    const experimentAsOpenai = experimentToOpenai(experiment);
    if (!experimentAsOpenai) return;

    const client = new OpenAI({
      apiKey: resolvedTokens.openai,
      dangerouslyAllowBrowser: hasBackend() ? undefined : true,
    });
    if (experimentAsOpenai.stream) {
      const params: ChatCompletionCreateParamsStreaming = {
        ...experimentAsOpenai,
        stream: true,
        temperature: get(tempAtom),
        model: get(modelAtom) ?? "gpt-4o",
      };
      const supportsTemp = get(modelSupportsTemperatureAtom);
      if (!supportsTemp) {
        params.temperature = undefined;
      }
      const stream = await client.chat.completions.create(params);
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
        if (typeof contentChunks[choice.index].content === "string") {
          contentChunks[choice.index].content += choice.delta.content ?? "";
        }
        set(experimentAtom, [...experiment, ...contentChunks]);
      }
      set(saveExperimentAtom);
      set(isRunningAtom, false);
    }
  }),
);

export const runExperimentAsMistral = entangledAtom(
  { name: "run-experiment-mistral" },
  atom(null, async (get, set) => {
    const resolvedTokens = await get(resolvedTokensAtom);
    const experiment = get(experimentAtom);
    set(isRunningAtom, true);

    if (!resolvedTokens.mistral) {
      console.error("No mistral token");
      return;
    }
    if (!experiment || experiment.length === 0) {
      console.error("No experiment");
      return;
    }

    const experimentAsMistral = experimentToMistral(experiment);
    if (!experimentAsMistral) return;

    const client = new Mistral({
      apiKey: resolvedTokens.mistral,
    });
    if (experimentAsMistral.stream) {
      const params: ChatCompletionStreamRequest = {
        ...experimentAsMistral,
        stream: true,
        temperature: get(tempAtom),
        model: get(modelAtom) ?? "mistral-small-latest",
      };
      const stream = await client.chat.stream(params);
      const contentChunks: Message[] = [];
      for await (const chunk of stream) {
        if (chunk.data.choices.length === 0) {
          continue;
        }
        const choice = chunk.data.choices[0];
        if (choice.index !== contentChunks.length - 1) {
          contentChunks.push({
            role: "assistant",
            fromServer: true,
            content: "",
          });
        }
        if (typeof contentChunks[choice.index].content === "string" && typeof choice.delta.content === "string") {
          contentChunks[choice.index].content += choice.delta.content ?? "";
        }
        set(experimentAtom, [...experiment, ...contentChunks]);
      }
      set(saveExperimentAtom);
      set(isRunningAtom, false);
    }
  }),
);
