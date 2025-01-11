import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { Literal, Union } from "runtypes";
import { experimentToAnthropic } from "../adapters/anthropic";
import { experimentToMistral } from "../adapters/mistral";
import { experimentToOpenai } from "../adapters/openai";
import { spawn } from "../utils";
import { entangledAtom } from "../utils/entanglement";
import { hasBackend } from "../utils/realm";
import { type Message, createExperiment, experimentAtom, parentAtom, storeAtom, tokensAtom } from "./common";

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

export const availableProviderOptionsAtom = atom((get) => {
  const tokens = get(tokensAtom);
  const providers = Object.keys(tokens).reduce<ProviderType[]>((acc, item) => {
    if (tokens[item]) {
      acc.push(item);
    }
    return acc;
  }, []);
  return providers.map((provider) => ({
    id: provider,
    name: providerLabels[provider],
  }));
});

export const selectedProviderAtom = entangledAtom("selected-provider", atom<ProviderType | undefined>(undefined));

export const OpenAIModel = Union(
  Literal("gpt-4o"),
  Literal("gpt-4o-mini"),
  Literal("gpt-4"),
  Literal("gpt-4-turbo"),
  Literal("o1"),
  Literal("o1-preview"),
  Literal("o1-mini"),
);
export const AnthropicModel = Union(
  Literal("claude-3-5-sonnet-latest"),
  Literal("claude-3-5-haiku-latest"),
  Literal("claude-3-opus-latest"),
);
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
export const modelLabels = {
  openai: {
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4": "GPT-4",
    "gpt-4-turbo": "GPT-4 Turbo",
    "o1": "O1",
    "o1-preview": "O1 Preview",
    "o1-mini": "O1 Mini",
  },
  anthropic: {
    "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
    "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
    "claude-3-opus-latest": "Claude 3 Opus",
  },
  mistral: {
    "mistral-large-latest": "Mistral Large",
    "mistral-medium-latest": "Mistral Medium",
    "mistral-small-latest": "Mistral Small",
  },
} as const;

export const modelOptionsAtom = atom((get) => {
  const provider = get(selectedProviderAtom);
  if (!provider) return [];
  return modelOptions[provider].map((model) => ({
    id: model,
    name: modelLabels[provider][model],
  }));
});

export const tempAtom = entangledAtom("temp", atom(0.0));
export const modelAtom = entangledAtom("model", atom<string>(""));
export const isRunningAtom = entangledAtom("is running", atom(false));

export const modelSupportsTemperatureAtom = atom((get) => {
  const provider = get(selectedProviderAtom);
  const model = get(modelAtom);
  if (provider === "openai" && ["o1-mini", "o1-preview", "o1"].includes(model)) {
    return false;
  }
  return true;
});

export const resolveToken = async (token: string) => {
  if (token.startsWith("op:")) {
    const resolvedToken = await spawn("op", ["read", token]);
    return resolvedToken.unwrapOr(token);
  }
  return token;
};

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
    set(isRunningAtom, true);

    try {
      switch (provider) {
        case "anthropic": {
          await set(runExperimentAsAnthropic);
          break;
        }
        case "openai": {
          await set(runExperimentAsOpenAi);
          break;
        }
        case "mistral": {
          await set(runExperimentAsMistral);
          break;
        }
      }
      set(saveExperimentAtom);
    } catch (e) {
      console.error(e);
    } finally {
      set(isRunningAtom, false);
    }
  }),
);

export const testStreaming = entangledAtom(
  { name: "test-streaming" },
  atom(null, async (get, set, content: string) => {
    const experiment = get(experimentAtom);

    let index = 0;
    const int = setInterval(() => {
      if (index >= content.length) {
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
          content: content.slice(0, index),
        },
      ]);
    }, 10);
  }),
);

export const runExperimentAsAnthropic = entangledAtom(
  { name: "run-experiment-anthropic" },
  atom(null, async (get, set) => {
    const provider = "anthropic" as const;
    const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").prop(provider));
    const tokenOrReference = get(tokenAtom);
    if (!tokenOrReference) {
      console.error(`No ${provider} token`);
      return;
    }
    const resolvedToken = await resolveToken(tokenOrReference);
    if (!resolvedToken) {
      console.error("No resolved token");
      return;
    }

    const experiment = get(experimentAtom);
    if (!experiment || experiment.length === 0) {
      console.error("No experiment");
      return;
    }

    const { stream, ...experimentAsAnthropic } = experimentToAnthropic(experiment);

    const anthropic = new Anthropic({
      apiKey: resolvedToken,
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
      set(experimentAtom, [
        ...experiment,
        ...contentBlocks.map((block) => {
          if (block.role === "tool" && typeof block.content === "string") {
            try {
              return {
                role: "tool" as const,
                fromServer: true,
                content: JSON.parse(block.content),
              };
            } catch (e) {
              return block;
            }
          }
          return block;
        }),
      ]);
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
    const provider = "openai" as const;
    const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").prop(provider));
    const tokenOrReference = get(tokenAtom);
    if (!tokenOrReference) {
      console.error(`No ${provider} token`);
      return;
    }
    const resolvedToken = await resolveToken(tokenOrReference);
    if (!resolvedToken) {
      console.error("No resolved token");
      return;
    }

    const experiment = get(experimentAtom);
    if (!experiment || experiment.length === 0) {
      console.error("No experiment");
      return;
    }

    const experimentAsOpenai = experimentToOpenai(experiment);

    const client = new OpenAI({
      apiKey: resolvedToken,
      dangerouslyAllowBrowser: hasBackend() ? undefined : true,
    });

    const params: ChatCompletionCreateParamsStreaming = {
      ...experimentAsOpenai,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      temperature: get(tempAtom),
      model: get(modelAtom) ?? "gpt-4o",
    };
    const supportsTemp = get(modelSupportsTemperatureAtom);
    if (!supportsTemp) {
      params.temperature = undefined;
    }
    const stream = await client.chat.completions.create(params);
    const contentChunks: Message[] = [];
    const namesForToolCalls = new Map<number, string>();
    for await (const chunk of stream) {
      if (chunk.choices.length === 0) {
        continue;
      }
      const choice = chunk.choices[0];
      const delta = choice.delta;
      if (!delta.content && !delta.tool_calls) {
        continue;
      }
      if (delta.tool_calls && delta.tool_calls.length > 0) {
        for (const toolCall of delta.tool_calls) {
          if (!contentChunks[toolCall.index]) {
            contentChunks[toolCall.index] = {
              role: "tool",
              fromServer: true,
              content: "",
            };
          }
          if (toolCall.function?.name) {
            namesForToolCalls.set(toolCall.index, toolCall.function.name);
          }
          if (toolCall.function?.arguments) {
            contentChunks[toolCall.index].content += toolCall.function.arguments;
          }
        }
      } else {
        if (!contentChunks[choice.index]) {
          contentChunks[choice.index] = {
            role: chunk.choices[0].delta.role ?? "assistant",
            fromServer: true,
            content: "",
          };
        }
        if (typeof contentChunks[choice.index].content === "string") {
          contentChunks[choice.index].content += choice.delta.content ?? "";
        }
      }

      set(experimentAtom, [...experiment, ...contentChunks]);
    }
    set(experimentAtom, [
      ...experiment,
      ...contentChunks.map((chunk, index) => {
        if (chunk.role === "tool" && typeof chunk.content === "string") {
          try {
            return {
              role: "tool" as const,
              fromServer: true,
              content: {
                function: namesForToolCalls.get(index),
                arguments: JSON.parse(chunk.content),
              },
            };
          } catch (e) {
            return chunk;
          }
        }
        return chunk;
      }),
    ]);
  }),
);

export const runExperimentAsMistral = entangledAtom(
  { name: "run-experiment-mistral" },
  atom(null, async (get, set) => {
    const provider = "mistral" as const;
    const tokenAtom = focusAtom(storeAtom, (o) => o.prop("tokens").prop(provider));
    const tokenOrReference = get(tokenAtom);
    if (!tokenOrReference) {
      console.error(`No ${provider} token`);
      return;
    }
    const resolvedToken = await resolveToken(tokenOrReference);
    if (!resolvedToken) {
      console.error("No resolved token");
      return;
    }

    const experiment = get(experimentAtom);
    if (!experiment || experiment.length === 0) {
      console.error("No experiment");
      return;
    }

    const experimentAsMistral = experimentToMistral(experiment);

    const client = new Mistral({
      apiKey: resolvedToken,
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
    }
  }),
);
