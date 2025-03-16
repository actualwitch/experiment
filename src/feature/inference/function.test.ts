import { describe, expect, it } from "bun:test";
import { tryParseFunctionSchema } from "./function";

import bio from "../../../fixtures/tools/bio.json";
import stock from "../../../fixtures/tools/stockPrice.json";
import type { Just } from "true-myth/maybe";
import type { ExperimentFunction } from "../../types";

describe("experiment function adapters", () => {
  it("openai/mistral schema", () => {
    const result = tryParseFunctionSchema(bio);
    expect(result.isJust).toBe(true);
    expect((result as Just<ExperimentFunction>).value).toMatchObject({
      name: "bio",
      description:
        "The `bio` tool allows you to persist information across conversations. The information will appear in the model set context below in future conversations.",
      schema: {
        type: "object",
        properties: {
          memory: {
            type: "string",
            description: "The information you want to persist across conversations.",
          },
        },
        required: ["memory"],
      },
    });
  });
  it("anthropic schema", () => {
    const result = tryParseFunctionSchema(stock);
    expect(result.isJust).toBe(true);
    expect((result as Just<ExperimentFunction>).value).toMatchObject({
      name: "get_stock_price",
      description: "Get the current stock price for a given ticker symbol.",
      schema: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: "The stock ticker symbol, e.g. AAPL for Apple Inc.",
          },
        },
        required: ["ticker"],
      },
    });
  });
  it("nothing schema", () => {
    const result = tryParseFunctionSchema({});
    expect(result.isJust).toBe(false);
  });
});
