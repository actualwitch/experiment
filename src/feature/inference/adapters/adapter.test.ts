import { describe, expect, it } from "bun:test";
import { experimentToAnthropic } from "./anthropic";
import templates from "../../../../fixtures/templates.json";
import { experimentToOpenai } from "./openai";
import { experimentToMistral } from "./mistral";

for (const [provider, adapter] of [
  ["anthropic", experimentToAnthropic],
  ["mistral", experimentToMistral],
  ["openai", experimentToOpenai],
] as const) {
  describe(`inference/${provider}`, () => {
    it("tool use experiment", () => {
      const result = adapter(templates["Tool use"].messages);
      expect(result).toMatchSnapshot();
    });
    it("sample", () => {
      const result = adapter(templates["Sample chat"].messages);
      expect(result).toMatchSnapshot();
    });
  });
}
