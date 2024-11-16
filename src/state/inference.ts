import Anthropic from "@anthropic-ai/sdk";
import { atom } from "jotai";
import OpenAI from "openai";
import { experimentToAnthropic } from "../adapters/anthropic";
import { experimentToOpenai } from "../adapters/openai";
import { maybeImport } from "../utils";
import { createExperiment, experimentAtom, tokensAtom, type ExperimentCursor, type Message } from "./common";
import { entangledAtom } from "./entanglement";
import makeRequestTool from "./makeRequestTool.json";
import { store } from "./store";

export { makeRequestTool };

export const toolsAtom = atom([makeRequestTool]);

export type InferenceProvider = "anthropic" | "openai";
export type OpenAiModel = "gpt-4o" | "gpt-4o-mini";

export const resolvedTokensAtom = atom<Promise<{ anthropic?: string; openai?: string }>>(async get => {
  const references = get(tokensAtom);
  const result: { anthropic?: string; openai?: string } = {};
  if (!references) return result;
  const [anthropic, openai] = await Promise.all(
    [references.anthropic, references.openai].map(async ref => {
      if (!ref) return null;
      const { spawn } = await maybeImport("child_process");
      if (!spawn) return null;
      const handle = spawn("op", ["read", ref]);
      return await new Promise<string | null>((ok, ko) => {
        handle.stdout.on("data", (data: unknown) => {
          ok(String(data).trim());
        });

        handle.stderr.on("data", (data: unknown) => {
          console.error(String(data));
        });

        handle.on("close", () => {
          ok(null);
        });
      });
    }),
  );
  if (anthropic) result.anthropic = anthropic;
  if (openai) result.openai = openai;
  return result;
});

export const hasResolvedTokenAtom = entangledAtom(
  "has resolved tokens",
  atom(async get => {
    const { anthropic, openai } = await get(resolvedTokensAtom);
    return {
      anthropic: !!anthropic,
      openai: !!openai,
    };
  }),
);

const saveExperimentAtom = entangledAtom(
  { name: "save-experiment" },
  atom(null, async (get, set) => {
    const experiment: Message[] = get(experimentAtom);
    if (!experiment.length) return;
    set(createExperiment, experiment);
  }),
);
const markdownTest =
  "## Header\n\nThis is a small showcase of common elements in markdown for testing purposes. Here's a `span`, and *italics*  and **bold** text. Here's a [link](https://www.kaggle.com). Here's a list:\n\n- item 1\n- item 2\n- item 3\n\nHere's a numbered list:\n\n1. item 1\n2. item 2\n3. item 3\n\nHere's a table:\n\n| Header 1 | Header 2 |\n|----------|----------|\n| cell 1   | cell 2   |\n| cell 3   | cell 4   |\n\nHere's a code block:\n\n```typescript\nconst interactive = css`\n  cursor: pointer;\n  user-select: none;\n  :hover {\n    opacity: 1;\n  }\n`;\n\nconst Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(const Emphasis = styled.em<{ isCollapsed?: boolean }>(\n  css`\n    font-weight: italic;\n    opacity: 0.7;\n  `,\n  ({ isCollapsed }) => {\n    if (!isCollapsed) return;\n    return css`\n      :before {\n        content: \"( \";\n        opacity: 0.3;\n      }\n      :after {\n        content: \" )\";\n        opacity: 0.3;\n      }\n    `;\n  },\n  interactive,\n);\n\n```\n\nHere's an image:\n\n![image](https://www.kaggle.com/static/images/site-logo.png)\n\nHere's a blockquote:\n\n> This is a blockquote.\n\nHere's a horizontal rule:\n\n---\n\n";
const testStreaming = atom(null, async (get, set) => {
  const experiment = get(experimentAtom);

  let index = 0;
  const int = setInterval(() => {
    if (index >= markdownTest.length) {
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
        content: markdownTest.slice(0, index),
      },
    ]);
  }, 10);
});

const runExperimentAsAnthropic = atom(null, async (get, set) => {
  const resolvedTokens = await store.get(resolvedTokensAtom);
  const experiment = get(experimentAtom);

  if (!resolvedTokens.anthropic || !experiment) return;

  const { stream, ...experimentAsAnthropic } = experimentToAnthropic(experiment);

  const anthropic = new Anthropic({ apiKey: resolvedTokens.anthropic });
  if (stream) {
    const stream = await anthropic.messages.create({
      ...experimentAsAnthropic,
      stream: true,
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
    set(saveExperimentAtom);
  } else {
    const response = await anthropic.messages.create(experimentAsAnthropic);
    for (const contentBlock of response.content) {
      if (contentBlock.type === "text") {
        set(experimentAtom, prev => [...prev, { role: "assistant", fromServer: true, content: contentBlock.text }]);
      }
      if (contentBlock.type === "tool_use") {
        set(experimentAtom, prev => [...prev, { role: "tool", fromServer: true, content: contentBlock }]);
      }
    }
  }
});

const runExperimentAsOpenAi = atom(null, async (get, set) => {
  const resolvedTokens = await store.get(resolvedTokensAtom);
  const experiment = get(experimentAtom);

  if (!resolvedTokens.openai || !experiment) return;

  const experimentAsOpenai = experimentToOpenai(experiment);
  if (!experimentAsOpenai) return;

  const client = new OpenAI({ apiKey: resolvedTokens.openai });
  if (experimentAsOpenai.stream) {
    const stream = await client.chat.completions.create({
      ...experimentAsOpenai,
      stream: true,
    });
    const contentChunks: Message[] = [];
    for await (const chunk of stream) {
      if (chunk.choices.length === 0) {
        continue;
      }
      const choice = chunk.choices[0];
      if (choice.index !== contentChunks.length - 1) {
        contentChunks.push({
          role: "assistant",
          fromServer: true,
          content: "",
        });
      }
      contentChunks[choice.index].content += choice.delta.content ?? "";
      set(experimentAtom, [...experiment, ...contentChunks]);
    }
    set(saveExperimentAtom);
  }
});

export default {
  runExperimentAsAnthropic: entangledAtom({ name: "run-experiment-anthropic" }, runExperimentAsAnthropic),
  runExperimentAsOpenAi: entangledAtom({ name: "run-experiment-openai" }, runExperimentAsOpenAi),
  testStreaming: entangledAtom({ name: "test-streaming" }, testStreaming),
};
