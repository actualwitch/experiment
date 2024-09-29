import Client from "@anthropic-ai/sdk";
import { spawn } from "child_process";
import { atom } from "jotai";
import { experimentToAnthropic } from "~/adapter";
import {
  ExperimentCursor,
  getExperimentAtom,
  getInitialStore,
  hasResolvedTokenAtom,
  Message,
  Store,
  store,
  storeAtom,
  tokenAtom,
} from "./common";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { createFileStorage } from "~/utils";

export const resolvedTokenAtom = atom<Promise<string | null>>(async (get) => {
  const reference = get(tokenAtom);
  if (!reference) return null;
  const handle = spawn("op", ["read", reference]);
  return await new Promise((ok, ko) => {
    handle.stdout.on("data", (data) => {
      const token = data.toString();
      ok(token.trim());
    });

    handle.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    handle.on("close", (code) => {
      console.error(code);
      ok(null);
    });
  });
});
export const runExperiment = atom(null, async (get, set, { id, runId }: ExperimentCursor) => {
  const resolvedToken = await store.get(resolvedTokenAtom);
  const experimentAtom = getExperimentAtom({ id, runId });
  const experiment = get(experimentAtom);

  if (!resolvedToken || !experiment) return;

  const { stream, ...experimentAsAnthropic } = experimentToAnthropic(experiment);

  const anthropic = new Client({ apiKey: resolvedToken });
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
});
export const testStreaming = atom(null, async (get, set, { id, runId }: ExperimentCursor) => {
  const experimentAtom = getExperimentAtom({ id, runId });
  const experiment = get(experimentAtom);

  if (!experiment) return;

  let index = 0;
  const pasta = `The FitnessGram Pacer Test is a multistage aerobic capacity test that progressively gets more difficult as it continues. The 20 meter pacer test will begin in 30 seconds. Line up at the start. The running speed starts slowly but gets faster each minute after you hear this signal bodeboop. A sing lap should be completed every time you hear this sound. ding Remember to run in a straight line and run as long as possible. The second time you fail to complete a lap before the sound, your test is over. The test will begin on the word start. On your mark. Get ready!… Start. ding﻿ `;
  const int = setInterval(() => {
    if (index >= pasta.length) {
      clearInterval(int);
      return;
    }
    set(experimentAtom, [...experiment, { role: "assistant", fromServer: true, content: pasta.slice(0, index++) }]);
  }, 100);
});

storeAtom.override(
  atomWithStorage<Store>(
    "store",
    getInitialStore(),
    createJSONStorage(() => createFileStorage("store")),
    {
      getOnInit: true,
    },
  ),
);

hasResolvedTokenAtom.override(
  atom(async (get) => {
    const token = await get(resolvedTokenAtom);
    return Boolean(token);
  }),
);
