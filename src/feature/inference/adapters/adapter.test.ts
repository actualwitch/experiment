import { describe, expect, it } from "bun:test";
import { experimentToAnthropic } from "./anthropic";
import templates from "../../../../fixtures/templates.json";
import anthropicTool from "../../../../fixtures/tools/stockPrice.json";
import { experimentToOpenai } from "./openai";
import { experimentToMistral } from "./mistral";

for (const [provider, adapter] of [
  ["anthropic", experimentToAnthropic],
  ["mistral", experimentToMistral],
  ["openai", experimentToOpenai],
] as const) {
  describe(`inference/${provider}`, () => {
    it("tool use experiment", async () => {
      const result = await adapter(templates["Tool use"].messages);
      expect(result).toMatchSnapshot();
    });
    it("sample", async () => {
      const result = await adapter(templates["Sample chat"].messages);
      expect(result).toMatchSnapshot();
    });
    // it("anthropic tool format", async () => {
    //   const result = await adapter([{ role: "tool", content: anthropicTool }]);
    //   expect(result).toMatchSnapshot();
    // });
  });
}
