import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import { atom } from "jotai";
import { observe } from "jotai-effect";
import { focusAtom } from "jotai-optics";
import { nanoid } from "nanoid";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { writeFile } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import OpenAI from "openai";
import type { ReasoningEffort } from "openai/resources/index.mjs";
import { tryOr } from "true-myth/result";

import { parentAtom } from "../../atoms/common";
import { createExperiment, experimentAtom } from "../../atoms/experiment";
import { modelAtom, selectedProviderAtom, storeAtom, tokensAtom } from "../../atoms/store";
import { newLine, tokenLimit } from "../../const";
import { store } from "../../store";
import type { Message } from "../../types";
import { getStoragePath, spawn as maybeSpawn } from "../../utils";
import { entangledAtom } from "../../utils/entanglement";
import { getName } from "../../utils/identity";
import { getRealm, hasBackend } from "../../utils/realm";
import { experimentToAnthropic } from "./adapters/anthropic";
import { experimentToMistral } from "./adapters/mistral";
import { experimentToOpenai } from "./adapters/openai";
import { mlxBackend } from "./backend";
import {
  type InferenceConfig,
  type ProviderType,
  isReasoningEffortSupported,
  isReasoningModel,
  modelLabels,
  modelOptions,
  providerIcons,
  providerLabels,
  providerTitles,
  providerTypes,
} from "./types";
import { createAssistantResponse, materializeExperiment } from "./utils";
import { unwrap } from "jotai/utils";

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

export const availableProviderOptionsAtom = atom((get) => {
  const tokens = get(tokensAtom);
  const providers = Object.keys(tokens).reduce<ProviderType[]>((acc, item) => {
    if (tokens[item] !== undefined) {
      acc.push(item);
    }
    return acc;
  }, []);
  return providers.map((provider) => ({
    id: provider,
    name: providerLabels[provider],
  }));
});

export const shouldEnableLocalInferenceAtom = entangledAtom(
  "local",
  atom(async (get) => {
    if (getRealm() === "server" || platform() !== "darwin") {
      const uvBin = await maybeSpawn("which", ["uv"]);
      return uvBin.match({ Ok: (val) => val !== "", Err: () => false });
    }
    return false;
  }),
);

export const newProviderOptionsAtom = unwrap(
  atom(async (get) => {
    const tokens = get(tokensAtom);
    const shouldEnableLocalInference = await get(shouldEnableLocalInferenceAtom);
    return providerTypes
      .filter((provider) =>
        tokens[provider] !== undefined ? false : provider === "local" ? shouldEnableLocalInference : true,
      )
      .map((provider) => ({
        value: provider,
        name: providerTitles[provider],
        icon: providerIcons[provider],
      }));
  }),
  (prev) => prev ?? [],
);

export const sessionAtom = atom(nanoid(6));

export const activeSession = entangledAtom(
  "session",
  atom((get) => get(sessionAtom)),
);

type StdioMessage =
  | { type: "ready" }
  | { type: "delta"; content: string }
  | { type: "error"; content: string }
  | { type: "info"; tokens: number; tps: number }
  | { type: "end" };

let inferenceBackend: ChildProcessWithoutNullStreams | null = null;
let inferenceBackendModel: string | null = null;
let inferenceBackendStatus: "inactive" | "activating" | "active" | "error" = "inactive";
let inferenceController: AbortController;
const target = new EventTarget();

if (getRealm() === "server") {
  inferenceController = new AbortController();
  const { signal } = inferenceController;
  // behold, a state machine
  const unobserve = observe((get, set) => {
    const selectedProvider = get(selectedProviderAtom);
    if (selectedProvider !== "local") {
      if (inferenceBackend) {
        inferenceBackend.kill();
        inferenceBackend = null;
        inferenceBackendModel = null;
        inferenceBackendStatus = "inactive";
      }
      return;
    }
    const selectedModel = get(modelAtom);
    if (!selectedModel) return;
    if (selectedModel !== inferenceBackendModel && inferenceBackend) {
      inferenceBackend.kill();
      inferenceBackend = null;
      inferenceBackendModel = null;
      inferenceBackendStatus = "inactive";
    }
    if (inferenceBackendStatus === "inactive") {
      inferenceBackendStatus = "activating";
      inferenceBackendModel = selectedModel;
      const fullPath = join(getStoragePath(), "server.py");
      writeFile(fullPath, mlxBackend, (err) => {
        if (err) {
          console.error(err);
          inferenceBackendStatus = "error";
        } else {
          inferenceBackend = spawn("uv", ["run", fullPath, `--model=${selectedModel}`], { signal });
          inferenceBackend.stdout.on("data", (data) => {
            tryOr("could not parse message", () => {
              const output: StdioMessage = JSON.parse(data.toString());
              if (output.type === "ready") {
                inferenceBackendStatus = "active";
              } else {
                target.dispatchEvent(new CustomEvent("message", { detail: output }));
              }
            });
          });
          inferenceBackend.stderr.on("data", (data) => {
            console.error(`backend stderr: ${data}`);
          });
        }
      });
      return;
    }
  }, store);

  process.on("beforeExit", () => {
    unobserve();
    inferenceController.abort();
  });
}

async function* generateTokens(config: InferenceConfig) {
  const listener = (e: CustomEvent | Event) => {
    if (!(e instanceof CustomEvent)) return;
    queue.push(e.detail);
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  };
  let resolveNext: (() => void) | null = null;
  const queue: StdioMessage[] = [];

  target.addEventListener("message", listener);
  inferenceBackend?.stdin.write(JSON.stringify(config) + newLine);

  while (true) {
    if (queue.length > 0) {
      const thisMessage = queue.shift();
      const type = thisMessage?.type;
      if (type === "end") {
        break;
      }
      if (type === "error") {
        throw new Error(thisMessage?.content);
      }
      if (type && ["delta", "info"].includes(type)) {
        yield thisMessage;
      }
    } else {
      await new Promise<void>((resolve) => {
        resolveNext = resolve;
      });
    }
  }
  while (queue.length > 0) {
    yield queue.shift();
  }
  target.removeEventListener("message", listener);
}

export const modelOptionsAtom = atom((get) => {
  const provider = get(selectedProviderAtom);
  if (!provider) return [];
  return modelOptions[provider].map((model) => ({
    id: model,
    name: modelLabels?.[model] ?? model,
  }));
});

export const resolveToken = async (token: string) => {
  if (token.startsWith("op:")) {
    const resolvedToken = await maybeSpawn("op", ["read", token]);
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
    if (!provider || experiment.length === 0 || (provider === "local" && inferenceBackendStatus !== "active")) return;
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
      if (typeof tokenOrReference !== "string") {
        throw new Error(`No ${provider} token`);
      }

      const resolvedToken = await resolveToken(tokenOrReference);
      if (typeof resolvedToken !== "string") {
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
        case "google": {
          await set(runExperimentAsOpenAi, {
            ...config,
            baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
          });
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
        case "local": {
          await set(runExperimentAsLocal, config);
          break;
        }
      }
      set(saveExperimentAtom);
    } catch (content) {
      set(experimentAtom, [
        ...experiment,
        { role: "error", fromServer: true, content: Error.isError(content) ? content.message : content },
      ]);
    } finally {
      set(isRunningAtom, false);
    }
  }),
);

export const runExperimentAsAnthropic = atom(null, async (get, set, config: InferenceConfig) => {
  const { temperature, token, n_tokens, messages, model, prefill } = config;
  const materializedExperiment = await materializeExperiment(messages);
  const anthropicExperiment = await experimentToAnthropic(materializedExperiment, config);

  const anthropic = new Anthropic({
    apiKey: token,
    dangerouslyAllowBrowser: hasBackend() ? undefined : true,
  });

  const stream = await anthropic.messages.create(anthropicExperiment);
  const contentBlocks: Message[] = prefill ? [prefill] : [];
  for await (const messageStreamEvent of stream) {
    if (messageStreamEvent.type === "content_block_start") {
      contentBlocks.push(
        createAssistantResponse(
          messageStreamEvent.content_block.type === "text" ? { role: "assistant", name: model } : { role: "tool" },
        ),
      );
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

    set(experimentAtom, [...messages, ...contentBlocks]);
  }
  set(experimentAtom, [
    ...messages,
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
  const { temperature, token, n_tokens, messages, model, prefill, baseUrl } = config;
  const materializedExperiment = await materializeExperiment(messages);
  const params = await experimentToOpenai(materializedExperiment, config);

  const client = new OpenAI({
    apiKey: token,
    baseURL: baseUrl,
    dangerouslyAllowBrowser: hasBackend() ? undefined : true,
  });
  const stream = await client.chat.completions.create(params);
  const contentChunks: Message[] = prefill ? [prefill] : [];
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
        contentChunks[choice.index] = createAssistantResponse({ role: "assistant", name: model });
      }
      if (typeof contentChunks[choice.index].content === "string") {
        contentChunks[choice.index].content += choice.delta.content ?? "";
      }
    }

    set(experimentAtom, [...messages, ...contentChunks]);
  }
  set(experimentAtom, [
    ...messages,
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
  const { temperature, token, n_tokens, messages, model, prefill } = config;
  const materializedExperiment = await materializeExperiment(messages);
  const experimentAsMistral = await experimentToMistral(materializedExperiment, config);

  const client = new Mistral({
    apiKey: token,
  });

  const stream = await client.chat.stream(experimentAsMistral);
  const contentChunks: Message[] = prefill ? [prefill] : [];
  for await (const chunk of stream) {
    if (chunk.data.choices.length === 0) {
      continue;
    }
    const [choice] = chunk.data.choices;
    const delta = choice.delta;
    const content = delta.content;
    const toolCalls = delta.toolCalls ?? [];
    if (content) {
      if (choice.index !== contentChunks.length - 1) {
        contentChunks.push(createAssistantResponse({ role: "assistant", name: model }));
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
    set(experimentAtom, [...messages, ...contentChunks]);
  }
});

export const runExperimentAsLocal = atom(null, async (get, set, config: InferenceConfig) => {
  const { temperature, token, n_tokens, messages, model, prefill } = config;
  const materializedExperiment = await materializeExperiment(messages, true);
  const contentChunks: Message[] = prefill ? [prefill] : [];
  contentChunks.push(createAssistantResponse({ role: "assistant", name: model }));
  for await (const chunk of generateTokens({
    ...config,
    messages: materializedExperiment,
    n_tokens: n_tokens === tokenLimit ? -1 : n_tokens,
  })) {
    if (chunk?.type === "delta") {
      contentChunks[0].content += chunk.content;
    }
    set(experimentAtom, [
      ...messages,
      ...contentChunks.map((message) => {
        if (typeof message.content === "string") {
          const name = getName(message.content);
          if (name) {
            const [_, rest] = message.content.split(`${name}:${newLine}${newLine}`);
            return { ...message, content: rest, name } as Message;
          }
        }
        return message;
      }),
    ]);
  }
});
