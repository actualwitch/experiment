import Client from "@anthropic-ai/sdk";
import { spawn } from "child_process";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { createFileStorage } from "~/utils";
import {
  appendToRun,
  bindToRealm,
  ExperimentCursor,
  getExperimentAtom,
  getInitialStore,
  Message,
  store,
  tokenAtom,
} from "./common";
import { getRealm, REALM } from "./entanglement";
import { experimentToAnthropic } from "~/adapter";

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

  if (!resolvedToken || !experiment || true) return;

  const { stream, ...experimentAsAnthropic } = experimentToAnthropic(experiment);

  const anthropic = new Client({ apiKey: resolvedToken });
  if (stream) {
    await anthropic.messages
      .stream(experimentAsAnthropic)
      .on("text", (text) => {
        set(experimentAtom, (prev) => [...prev, { role: "assistant", fromServer: true, content: text }]);
      })
      .on("inputJson", (tool) => {
        set(experimentAtom, (prev) => [...prev, { role: "tool", fromServer: true, content: tool }]);
      });
    // const stream = await anthropic.messages.create({
    //   ...experimentAsAnthropic,
    //   stream: true,
    // });
    // const contentBlocks: Message[] = [];
    // for await (const messageStreamEvent of stream) {
    //   if (messageStreamEvent.type === "content_block_start") {
    //     contentBlocks.push({role: "assistant", fromServer: true, content: ""});
    //   }
    //   if (messageStreamEvent.type ==="content_block_delta") {
    //     const block = contentBlocks[messageStreamEvent.index];
    //     block.content += messageStreamEvent.delta.text;
    //   }

    //   set(experimentAtom, (prev) => [...prev, { role: "assistant", fromServer: true, content: messageStreamEvent }]);
    // }
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

bindToRealm({
  [REALM]: "server",
  storeAtom: atomWithStorage(
    "store",
    getInitialStore(),
    createJSONStorage(() => createFileStorage("store")),
    {
      getOnInit: getRealm() === "server",
    },
  ),
  hasResolvedTokenAtom: atom(
    async (get) => {
      const token = await get(resolvedTokenAtom);
      return Boolean(token);
    },
    () => {},
  ),
});
