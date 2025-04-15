import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import type { ChatCompletionStreamRequest } from "@mistralai/mistralai/models/components";
import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsStreaming, ReasoningEffort } from "openai/resources/index.mjs";

import { experimentToAnthropic } from "./adapters/anthropic";
import { experimentToMistral } from "./adapters/mistral";
import { experimentToOpenai } from "./adapters/openai";
import { spawn } from "../../utils";
import { entangledAtom } from "../../utils/entanglement";
import { hasBackend } from "../../utils/realm";
import { parentAtom } from "../../atoms/common";
import { createExperiment, experimentAtom } from "../../atoms/experiment";
import { modelAtom, selectedProviderAtom, storeAtom, tokensAtom } from "../../atoms/store";
import type { Message } from "../../types";
import {
  isReasoningEffortSupported,
  isReasoningModel,
  modelLabels,
  modelOptions,
  providerLabels,
  type InferenceConfig,
  type ProviderType,
} from "./types";
import { tokenLimit } from "../../const";

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

export const modelOptionsAtom = atom((get) => {
  const provider = get(selectedProviderAtom);
  if (!provider) return [];
  return modelOptions[provider].map((model) => ({
    id: model,
    name: modelLabels?.[provider]?.[model] ?? model,
  }));
});

export const tempAtom = entangledAtom("temp", atom(0.0));
export const effortAtom = entangledAtom("effort", atom<ReasoningEffort>("medium"));
export const isRunningAtom = entangledAtom("is running", atom(false));

export const isReasoningModelAtom = atom((get) => {
  const model = get(modelAtom);
  if (get(selectedProviderAtom) === "openai" && model && isReasoningModel(model)) {
    return true;
  }
  return false;
});

export const isReasoningEffortSupportedAtom = atom((get) => {
  const model = get(modelAtom);
  if (get(selectedProviderAtom) === "openai" && model && isReasoningEffortSupported(model)) {
    return true;
  }
  return false;
});

export const resolveToken = async (token: string) => {
  if (token.startsWith("op:")) {
    const resolvedToken = await spawn("op", ["read", token]);
    return resolvedToken.unwrapOr(null);
  }
  return token;
};

export const saveExperimentAtom = atom(null, (get, set) => {
  const experiment = get(experimentAtom);
  if (experiment.length > 0) {
    const { id } = set(createExperiment, experiment);
    // set parent id if unset
    const parent = get(parentAtom);
    if (!parent) {
      set(parentAtom, id);
    }
  }
});

export const runInferenceAtom = entangledAtom(
  { name: "run-inference" },
  atom(null, async (get, set) => {
    const provider = get(selectedProviderAtom);
    const experiment = get(experimentAtom);
    if (!provider || experiment.length === 0) return;
    const noErrors = experiment.filter((msg) => msg.role !== "error");
    if (experiment.length !== noErrors.length) {
      set(experimentAtom, noErrors);
    }

    set(isRunningAtom, true);

    try {
      const model = get(modelAtom);
      if (!model) {
        throw new Error("Model not set");
      }

      const tokenOrReference = get(focusAtom(storeAtom, (o) => o.prop("tokens").prop(provider)));
      if (!tokenOrReference) {
        throw new Error(`No ${provider} token`);
      }

      const resolvedToken = await resolveToken(tokenOrReference);
      if (!resolvedToken) {
        throw new Error("Could not resolve token");
      }

      const experiment: Message[] = get(experimentAtom);

      const config: InferenceConfig = {
        provider,
        model,
        temperature: get(tempAtom),
        reasoningEffort: get(effortAtom),
        messages: experiment,
        n_tokens: tokenLimit,
        token: resolvedToken,
        stream: true,
      };

      if (experiment.length > 0) {
        // support prefilling assistant response
        if (experiment.at(-1)?.role === "assistant") {
          config.prefill = experiment.pop();
        }
      }

      switch (provider) {
        case "anthropic": {
          await set(runExperimentAsAnthropic, config);
          break;
        }
        case "openai": {
          await set(runExperimentAsOpenAi, config);
          break;
        }
        case "mistral": {
          await set(runExperimentAsMistral, config);
          break;
        }
      }
      set(saveExperimentAtom);
    } catch (content) {
      set(experimentAtom, [...get(experimentAtom), { role: "error", fromServer: true, content }]);
    } finally {
      set(isRunningAtom, false);
    }
  }),
);

export const runExperimentAsAnthropic = atom(null, async (get, set, config: InferenceConfig) => {
  const { temperature, token, n_tokens, messages: experiment, model, prefill } = config;
  const anthropicExperiment = await experimentToAnthropic(experiment, config);

  const anthropic = new Anthropic({
    apiKey: token,
    dangerouslyAllowBrowser: hasBackend() ? undefined : true,
  });

  const stream = await anthropic.messages.create(anthropicExperiment);
  const contentBlocks: Message[] = prefill ? [prefill] : [];
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
});

export const runExperimentAsOpenAi = atom(null, async (get, set, config: InferenceConfig) => {
  const { temperature, token, n_tokens, messages: experiment, model, prefill } = config;
  const params = await experimentToOpenai(experiment, config);

  const client = new OpenAI({
    apiKey: token,
    dangerouslyAllowBrowser: hasBackend() ? undefined : true,
  });
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
});

export const runExperimentAsMistral = atom(null, async (get, set, config: InferenceConfig) => {
  const { temperature, token, n_tokens, messages: experiment, model, prefill } = config;
  const experimentAsMistral = await experimentToMistral(experiment);

  const client = new Mistral({
    apiKey: token,
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
      const delta = choice.delta;
      const content = delta.content;
      const toolCalls = delta.toolCalls ?? [];
      if (content) {
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
      } else if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.index !== contentChunks.length - 1) {
            contentChunks.push({
              role: "tool",
              fromServer: true,
              content: "",
            });
          }
          contentChunks[toolCall.index!].content = toolCall.function;
        }
      }
      set(experimentAtom, [...experiment, ...contentChunks]);
    }
  }
});
