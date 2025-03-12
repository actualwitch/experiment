import { Literal, Union } from "runtypes";

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

const GPT_4_5 = Literal("gpt-4.5-preview");
const GPT_4o = Literal("gpt-4o");
const GPT_4o_mini = Literal("gpt-4o-mini");
const GPT_4 = Literal("gpt-4");
const GPT_4_turbo = Literal("gpt-4-turbo");
const o3_mini = Literal("o3-mini");
const o1 = Literal("o1");
const o1_preview = Literal("o1-preview");
const o1_mini = Literal("o1-mini");

export const OpenAIModel = Union(GPT_4_5, GPT_4o, GPT_4o_mini, GPT_4, GPT_4_turbo, o3_mini, o1, o1_preview, o1_mini);

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
    [GPT_4_5.value]: "GPT-4.5",
    [GPT_4o.value]: "GPT-4o",
    [GPT_4o_mini.value]: "GPT-4o Mini",
    [GPT_4.value]: "GPT-4",
    [GPT_4_turbo.value]: "GPT-4 Turbo",
    [o1.value]: "O1",
    [o1_preview.value]: "O1 Preview",
    [o1_mini.value]: "O1 Mini",
    [o3_mini.value]: "O3 Mini",
  },
  anthropic: {
    [Claude_3_Opus.value]: "Claude 3 Opus",
    [Claude_3_5_Haiku.value]: "Claude 3.5 Haiku",
    [Claude_3_5_Sonnet.value]: "Claude 3.5 Sonnet",
    [Claude_3_6_Sonnet.value]: "Claude 3.6 Sonnet",
    [Claude_3_7_Sonnet.value]: "Claude 3.7 Sonnet",
  },
  mistral: {
    "mistral-large-latest": "Mistral Large",
    "mistral-medium-latest": "Mistral Medium",
    "mistral-small-latest": "Mistral Small",
  },
} as const;

export const isReasoningModel = (model: string) =>
  [o1_mini.value, o1_preview.value, o3_mini.value, o1.value].includes(model);
