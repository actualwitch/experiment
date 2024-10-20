import Anthropic from "@anthropic-ai/sdk";
import { atom, createStore, type WritableAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import type { Atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { entangledAtom, serverAtom } from "./entanglement";
import { createFileStorage, getRealm } from "../utils";
import { experimentToAnthropic } from "../adapters/anthropic";

export const store = createStore();

type _Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: object | string }
  | { role: "tool"; content: object | string };

export type Message = _Message & { fromServer?: boolean } & {
  template?: string;
};

export type Role = "system" | "user" | "assistant" | "tool";

export type Experiment = {
  [runId: string]: Message[];
};

export type Store = {
  isDarkMode?: boolean;
  experiments?: Record<string, Experiment>;
  templates?: Record<string, _Message>;
  tokens: {
    anthropic?: string;
    openai?: string;
  };
};

function divergentAtom<T extends Atom<unknown> | WritableAtom<unknown, unknown[], unknown>>(
  ...cases: Array<() => T | undefined>
) {
  let result: T | undefined;
  for (const c of cases) {
    result = c();
    if (result) break;
  }
  if (!result) throw new Error("No atom was created");
  return result;
}

export const getInitialStore = (): Store => ({
  tokens: { anthropic: undefined },
  experiments: {},
});
export const storeAtom = divergentAtom(() => {
  if (getRealm() === "server") {
    return atomWithStorage<Store>(
      "store",
      getInitialStore(),
      createJSONStorage(() => createFileStorage("store")),
      {
        getOnInit: true,
      },
    );
  }

  return atom<Store>(getInitialStore());
});

export const voidAtom = atom<void>(void 0);

function maybeImport(path: string) {
  if (getRealm() === "server") {
    return import(path);
  }
  return Promise.resolve({});
}

export const resolvedTokensAtom = atom<Promise<{ anthropic?: string; openai?: string }>>(async (get) => {
  const references = get(tokensAtom);
  let result: { anthropic?: string; openai?: string } = {};
  if (!references) return result;
  const [anthropic, openai] = await Promise.all(
    [references.anthropic, references.openai].map(async (ref) => {
      if (!ref) return null;
      const { spawn } = await maybeImport("child_process");
      if (!spawn) return null;
      const handle = spawn("op", ["read", ref]);
      return await new Promise<string | null>((ok, ko) => {
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
    }),
  );
  if (anthropic) result.anthropic = anthropic;
  if (openai) result.openai = openai;
  return result;
});

export const hasResolvedTokenAtom = divergentAtom(() => {
  if (getRealm() === "server") {
    return atom(async (get) => {
      const { anthropic, openai } = await get(resolvedTokensAtom);
      return {
        anthropic: !!anthropic,
        openai: !!openai,
      };
    });
  }
  return atom({
    anthropic: false,
    openai: false,
  });
});
export const experimentAtom = entangledAtom("experiment", atom<Message[]>([]));

export const experimentIdsAtom = entangledAtom(
  "experimentIds",
  atom((get) => {
    const store = get(storeAtom);
    const ids: Array<[id: string, subId: string]> = [];
    for (const id in store.experiments) {
      for (const runId in store.experiments[id]) {
        ids.push([id, runId]);
      }
    }
    return ids;
  }),
);

export const experimentsAtom = focusAtom(storeAtom, (o) => o.prop("experiments"));

export const deleteExperiment = atom(null, (get, set, id: string) => {
  set(experimentsAtom, (prev) => {
    const next = { ...prev };
    delete next[id];
    return next;
  });
});

export const getExperimentAtom = ({ id, runId }: ExperimentCursor) =>
  focusAtom(storeAtom, (o) => o.prop("experiments").optional().prop(id).optional().prop(runId));

export const tokensAtom = entangledAtom(
  "tokens",
  focusAtom(storeAtom, (o) => o.prop("tokens")),
);

export const isDarkModeAtom = entangledAtom(
  "isDarkMode",
  focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
);

export type ExperimentCursor = { id: string; runId: string };

export const createExperiment = atom(
  null,
  (get, set, messages?: Message[], id?: string, runId?: string): ExperimentCursor => {
    const exp = get(experimentsAtom) ?? {};
    id ??= String(Object.keys(exp).length + 1);

    const thisExperiment = exp[id] ?? {};
    runId ??= String(Object.keys(thisExperiment).length + 1);

    set(experimentsAtom, (prev) => ({
      ...prev,
      [id]: { ...thisExperiment, [runId]: messages ?? [] },
    }));

    return { id, runId };
  },
);

export const appendToRun = atom(null, (get, set, cursor: ExperimentCursor, messages: Message[]) => {
  const { id, runId } = cursor || {};
  const focus = getExperimentAtom({ id, runId });
  const current = get(focus);
  set(focus, (prev = []) => [...prev, ...messages]);
  return current?.length ?? 0;
});

export const newChatAtom = atom<Message[]>([]);

export const templatesAtom = focusAtom(storeAtom, (o) => o.prop("templates"));


export const runExperiment = serverAtom(
  { name: "run-experiment"},atom(
  null,
  async (get, set, { id, runId }: ExperimentCursor) => {
    const resolvedToken = await store.get(resolvedTokensAtom);
    const experimentAtom = getExperimentAtom({ id, runId });
    const experiment = get(experimentAtom);

    if (!resolvedToken || !experiment) return;

    const { stream, ...experimentAsAnthropic } =
      experimentToAnthropic(experiment);

    const anthropic = new Anthropic({ apiKey: resolvedToken.anthropic });
    if (stream) {
      const stream = await anthropic.messages.create({
        ...experimentAsAnthropic,
        stream: true,
      });
      const contentBlocks: Message[] = [];
      for await (const messageStreamEvent of stream) {
        if (messageStreamEvent.type === "content_block_start") {
          contentBlocks.push({
            role:
              messageStreamEvent.content_block.type === "text"
                ? "assistant"
                : "tool",
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
          set(experimentAtom, (prev) => [
            ...prev,
            { role: "assistant", fromServer: true, content: contentBlock.text },
          ]);
        }
        if (contentBlock.type === "tool_use") {
          set(experimentAtom, (prev) => [
            ...prev,
            { role: "tool", fromServer: true, content: contentBlock },
          ]);
        }
      }
    }
  }
));

export const testStreaming = serverAtom(
  { name: "test-streaming", },
  atom(null, async (get, set, chat: Message[]) => {
    const cursor = set(createExperiment, chat);
    const experimentAtom = getExperimentAtom(cursor);
    const experiment = get(experimentAtom);

    if (!experiment) return;

    let index = 0;
    const pasta = `The FitnessGram Pacer Test is a multistage aerobic capacity test that progressively gets more difficult as it continues. The 20 meter pacer test will begin in 30 seconds. Line up at the start. The running speed starts slowly but gets faster each minute after you hear this signal bodeboop. A sing lap should be completed every time you hear this sound. ding Remember to run in a straight line and run as long as possible. The second time you fail to complete a lap before the sound, your test is over. The test will begin on the word start. On your mark. Get ready!… Start. ding﻿ `;
    const int = setInterval(() => {
      console.log("sending", index);
      if (index >= pasta.length) {
        clearInterval(int);
        return;
      }
      set(experimentAtom, [
        ...experiment,
        {
          role: "assistant",
          fromServer: true,
          content: pasta.slice(0, index++),
        },
      ]);
    }, 100);
    return cursor;
  }),
);
