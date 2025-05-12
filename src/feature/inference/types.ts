import { Literal, Union } from "runtypes";
import type { Message } from "../../types";
import type { ReasoningEffort } from "openai/resources/shared.mjs";

export function withIds<T extends string>(items: T[] | readonly T[]) {
  return items.map((name) => ({
    id: name,
    name,
  }));
}
export const providerTypes = ["anthropic", "google", "mistral", "openai", "local"] as const;
export type ProviderType = (typeof providerTypes)[number];
export const providers = withIds(providerTypes);
export const providerLabels = {
  anthropic: "🧶 Anthropic",
  google: "✨ Google",
  mistral: "🐈 Mistral",
  openai: "🪢 OpenAI",
  local: "💻 Local",
} satisfies { [K in ProviderType]: string };

const Claude_3_7_Sonnet = Literal("claude-3-7-sonnet-20250219");
const Claude_3_6_Sonnet = Literal("claude-3-5-sonnet-20241022");
const Claude_3_5_Sonnet = Literal("claude-3-5-sonnet-20240620");
const Claude_3_5_Haiku = Literal("claude-3-5-haiku-20241022");
const Claude_3_Opus = Literal("claude-3-opus-20240229");

export const AnthropicModel = Union(
  Claude_3_7_Sonnet,
  Claude_3_6_Sonnet,
  Claude_3_5_Sonnet,
  Claude_3_5_Haiku,
  Claude_3_Opus,
);

const Gemini_2_5_Pro = Literal("gemini-2.5-pro-preview-05-06");
const Gemini_2_5_Flash = Literal("gemini-2.5-flash-preview-04-17");
const Gemini_2_0_Pro = Literal("gemini-2.0-pro-exp-02-05");

export const GoogleModel = Union(Gemini_2_5_Pro, Gemini_2_5_Flash, Gemini_2_0_Pro);

const Mistral_Large = Literal("mistral-large-latest");
const Mistral_Medium = Literal("mistral-medium-latest");
const Mistral_Small = Literal("mistral-small-latest");
export const MistralModel = Union(Mistral_Large, Mistral_Medium, Mistral_Small);

const GPT_4_5 = Literal("gpt-4.5-preview");
const GPT_4_1 = Literal("gpt-4.1");
const GPT_4_1_mini = Literal("gpt-4.1-mini");
const GPT_4_1_nano = Literal("gpt-4.1-nano");
const ChatGPT = Literal("chatgpt-4o-latest");
const GPT_4o = Literal("gpt-4o");
const GPT_4o_mini = Literal("gpt-4o-mini");
const GPT_4 = Literal("gpt-4");
const GPT_4_turbo = Literal("gpt-4-turbo");
const o4_mini = Literal("o4-mini");
const o3 = Literal("o3");
const o3_mini = Literal("o3-mini");
const o1 = Literal("o1");
const o1_pro = Literal("o1-pro");
const o1_preview = Literal("o1-preview");
const o1_mini = Literal("o1-mini");

export const OpenAIModel = Union(
  GPT_4_5,
  GPT_4_1,
  GPT_4_1_mini,
  GPT_4_1_nano,
  ChatGPT,
  GPT_4o,
  GPT_4o_mini,
  GPT_4,
  GPT_4_turbo,
  o4_mini,
  o3,
  o3_mini,
  o1,
  // o1_pro,
  o1_preview,
  o1_mini,
);

const Local_Mistral_Small = Literal("mistralai/Mistral-Small-24B-Instruct-2501");
const Local_Mistral_Large = Literal("mlx-community/Mistral-Large-Instruct-2407-4bit");
const Local_Gemma_3_27 = Literal("google/gemma-3-27b-it");
const Local_Gemma_3_27_QAT = Literal("mlx-community/gemma-3-27b-it-qat-4bit");
const Local_Gemma_3_4_QAT = Literal("mlx-community/gemma-3-4b-it-qat-4bit");

export const LocalModel = Union(
  Local_Mistral_Small,
  Local_Mistral_Large,
  Local_Gemma_3_27,
  Local_Gemma_3_27_QAT,
  Local_Gemma_3_4_QAT,
);

export const modelOptions = {
  anthropic: AnthropicModel.alternatives.map((model) => model.value),
  google: GoogleModel.alternatives.map((model) => model.value),
  mistral: MistralModel.alternatives.map((model) => model.value),
  openai: OpenAIModel.alternatives.map((model) => model.value),
  local: LocalModel.alternatives.map((model) => model.value),
};
export const modelLabels = {
  // anthropic
  [Claude_3_Opus.value]: "Claude 3 Opus",
  [Claude_3_5_Haiku.value]: "Claude 3.5 Haiku",
  [Claude_3_5_Sonnet.value]: "Claude 3.5 Sonnet",
  [Claude_3_6_Sonnet.value]: "Claude 3.6 Sonnet",
  [Claude_3_7_Sonnet.value]: "Claude 3.7 Sonnet",
  // google
  [Gemini_2_5_Pro.value]: "Gemini 2.5 Pro",
  [Gemini_2_5_Flash.value]: "Gemini 2.5 Flash",
  [Gemini_2_0_Pro.value]: "Gemini 2.0 Pro",
  // mistral
  [Mistral_Large.value]: "Mistral Large",
  [Mistral_Medium.value]: "Mistral Medium",
  [Mistral_Small.value]: "Mistral Small",
  // openai
  [GPT_4_5.value]: "GPT-4.5",
  [GPT_4_1.value]: "GPT-4.1",
  [GPT_4_1_mini.value]: "GPT-4.1 Mini",
  [GPT_4_1_nano.value]: "GPT-4.1 Nano",
  [ChatGPT.value]: "ChatGPT",
  [GPT_4o.value]: "GPT-4o",
  [GPT_4o_mini.value]: "GPT-4o Mini",
  [GPT_4.value]: "GPT-4",
  [GPT_4_turbo.value]: "GPT-4 Turbo",
  [o4_mini.value]: "O4 Mini",
  [o3.value]: "O3",
  [o3_mini.value]: "O3 Mini",
  [o1.value]: "O1",
  [o1_pro.value]: "O1 Pro",
  [o1_preview.value]: "O1 Preview",
  [o1_mini.value]: "O1 Mini",
  // local
  [Local_Mistral_Small.value]: "Mistral Small",
  [Local_Mistral_Large.value]: "Mistral Large",
  [Local_Gemma_3_27.value]: "Gemma 3 27B",
  [Local_Gemma_3_27_QAT.value]: "Gemma 3 27B (QAT)",
  [Local_Gemma_3_4_QAT.value]: "Gemma 3 4B (QAT)",
} as const;

export const isReasoningModel = (model: string) =>
  [o1_mini.value, o1_preview.value, o1.value, o3_mini.value, o3.value, o4_mini.value].includes(model);

export const isReasoningEffortSupported = (model: string) =>
  [o1_preview.value, o1.value, o3_mini.value, o3.value, o4_mini.value].includes(model);

export type InferenceConfig = {
  stream: true;
  token: string;
  provider: ProviderType;
  model: string;
  temperature: number;
  reasoningEffort?: ReasoningEffort;
  n_tokens: number;
  messages: Message[];
  prefill?: Message;
  baseUrl?: string;
};
