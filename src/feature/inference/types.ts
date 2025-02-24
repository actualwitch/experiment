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

export const OpenAIModel = Union(
  Literal("gpt-4o"),
  Literal("gpt-4o-mini"),
  Literal("gpt-4"),
  Literal("gpt-4-turbo"),
  Literal("o1"),
  Literal("o1-preview"),
  Literal("o1-mini"),
  Literal("o3-mini"),
);

const Claude_3_Opus = Literal("claude-3-opus-20240229");
const Claude_3_5_Haiku = Literal("claude-3-5-haiku-20241022");
const Claude_3_5_Sonnet = Literal("claude-3-5-sonnet-20240620");
const Claude_3_6_Sonnet = Literal("claude-3-5-sonnet-20241022");
const Claude_3_7_Sonnet = Literal("claude-3-7-sonnet-20250219");

export const AnthropicModel = Union(
  Claude_3_Opus,
  Claude_3_5_Haiku,
  Claude_3_5_Sonnet,
  Claude_3_6_Sonnet,
  Claude_3_7_Sonnet,
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
    "o3-mini": "O3 Mini",
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
