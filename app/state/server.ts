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
  const experiment = store.get(getExperimentAtom({ id, runId }));

  if (!resolvedToken || !experiment) return;

  const experimentAsAnthropic = experimentToAnthropic(experiment);

  const anthropic = new Client({ apiKey: resolvedToken });
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 128,
    messages: experimentAsAnthropic.messages,
    system: experimentAsAnthropic.system,
  });
  const newMessages = response.content.reduce<Message[]>((acc, contentBlock) => {
    if (contentBlock.type === "text") {
      acc.push({ role: "assistant", content: contentBlock.text });
    }
    if (contentBlock.type === "tool_use") {
      acc.push({ role: "tool", content: contentBlock });
    }
    return acc;
  }, []);
  await store.set(appendToRun, { id, runId }, newMessages);
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
  hasResolvedTokenAtom: atom(async (get) => {
    const token = await get(resolvedTokenAtom);
    return Boolean(token);
  }, () => {})
});
