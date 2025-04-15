import { describe, expect, it } from "bun:test";
import { experimentToAnthropic } from "./anthropic";
import templates from "../../../../fixtures/templates.json";
import anthropicTool from "../../../../fixtures/tools/stockPrice.json";
import { experimentToOpenai } from "./openai";
import { experimentToMistral } from "./mistral";
import type { InferenceConfig, ProviderType } from "../types";
import { match } from "ts-pattern";
import { tokenLimit } from "../../../const";

const getDefaultModel = (provider: ProviderType) =>
  match(provider)
    .with("anthropic", () => "claude-3-5-haiku-20241022")
    .with("mistral", () => "mistral-small-latest")
    .with("openai", () => "gpt-4o")
    .exhaustive();

for (const [provider, adapter] of [
  ["anthropic", experimentToAnthropic],
  ["mistral", experimentToMistral],
  ["openai", experimentToOpenai],
] as const) {
  describe(`inference/${provider}`, () => {
    it("tool use experiment", async () => {
      const config: InferenceConfig = {
        provider,
        model: getDefaultModel(provider),
        n_tokens: tokenLimit,
        temperature: 0,
      };
      const result = await adapter(templates["Tool use"].messages, config);
      expect(result).toMatchSnapshot();
    });
    it("sample", async () => {
      const config: InferenceConfig = {
        provider,
        model: getDefaultModel(provider),
        n_tokens: tokenLimit,
        temperature: 0,
      };
      const result = await adapter(templates["Sample chat"].messages, config);
      expect(result).toMatchSnapshot();
    });
    // it("anthropic tool format", async () => {
    //   const result = await adapter([{ role: "tool", content: anthropicTool }]);
    //   expect(result).toMatchSnapshot();
    // });
  });
}
