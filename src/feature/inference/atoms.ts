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
import { isReasoningModel, modelLabels, modelOptions, providerLabels, type ProviderType } from "./types";

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
    if (!experiment.length) return;
    set(createExperiment, experiment);
  }),
);

export const runInferenceAtom = entangledAtom(
  { name: "run-inference" },
  atom(null, async (get, set) => {
    const provider = get(selectedProviderAtom);
    if (!provider) return;
    set(isRunningAtom, true);
    const experiment = get(experimentAtom);
    const noErrors = experiment.filter((msg) => msg.role !== "error");
    if (experiment.length !== noErrors.length) {
      set(experimentAtom, noErrors);
    }

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
      const experiment: Message[] = get(experimentAtom);
      if (experiment.length > 0) {
        const { id } = set(createExperiment, experiment);
        const parent = get(parentAtom);
        if (!parent) {
          set(parentAtom, id);
        }
      }
    } catch (content) {
      const experiment = get(experimentAtom);
      set(experimentAtom, [...experiment, { role: "error", fromServer: true, content }]);
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

    const { stream, ...experimentAsAnthropic } = await experimentToAnthropic(experiment);

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

    const experimentAsOpenai = await experimentToOpenai(experiment);

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
    if (get(isReasoningModelAtom)) {
      params.temperature = undefined;
      params.reasoning_effort = get(effortAtom);
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

    const experimentAsMistral = await experimentToMistral(experiment);

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
  }),
);
