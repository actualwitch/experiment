import { atomEffect } from "jotai-effect";
import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Literal, Union, type Static } from "runtypes";

import { createFileStorage, spawn } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { getRealm, hasBackend } from "../utils/realm";

export type LayoutType = "mobile" | "desktop";
export const layoutAtom = atom<LayoutType>();
export const mobileQuery = "(max-width: 920px)";
export const desktopQuery = "(min-width: 921px)";

export const layoutTrackerAtom = atomEffect((get, set) => {
  const mql = window.matchMedia(mobileQuery);
  const listener = (mql: MediaQueryList | MediaQueryListEvent) => {
    set(layoutAtom, mql.matches ? "mobile" : "desktop");
  };
  listener(mql);
  mql.addEventListener("change", listener);
  return () => {
    mql.removeEventListener("change", listener);
  };
});
export type WithLayout = { layout?: "mobile" | "desktop" };

export const _isActionPanelOpenAtom = atom(false);
export const _isNavPanelOpenAtom = atom(false);

export const isActionPanelOpenAtom = atom(
  (get) => get(_isActionPanelOpenAtom),
  (get, set, value: boolean) => {
    if (value && get(_isNavPanelOpenAtom)) {
      set(_isNavPanelOpenAtom, false);
      return;
    }
    set(_isActionPanelOpenAtom, value);
  },
);
export const isNavPanelOpenAtom = atom(
  (get) => get(_isNavPanelOpenAtom),
  (get, set, value: boolean) => {
    if (value && get(_isActionPanelOpenAtom)) set(_isActionPanelOpenAtom, false);
    set(_isNavPanelOpenAtom, value);
  },
);

export type StringContent = { content: string };
export type ObjectOrStringContent = { content: object | string };
export type WithName = { name: "string" };

export const StringType = Union(Literal("system"), Literal("developer"), Literal("user"));
export const ObjectOrStringType = Union(Literal("assistant"), Literal("info"), Literal("tool"));

export type _Message =
  | ({ role: Static<typeof StringType> } & StringContent & Partial<WithName>)
  | ({ role: Static<typeof ObjectOrStringType> } & ObjectOrStringContent & Partial<WithName>);

export type WithDirection = { fromServer?: boolean };
export type WithTemplate = {
  template?: string;
};

export type Message = _Message & WithDirection & WithTemplate;

export type Role = "system" | "user" | "assistant" | "tool";

export type Experiment = {
  [runId: string]: Message[];
};

export type Store = {
  isBoldText?: boolean;
  isDarkMode?: boolean;
  experimentLayout?: "left" | "chat" | "chat-reverse";
  rendererMode?: "markdown" | "text+json";
  experiments?: Record<string, Experiment>;
  templates?: Record<string, _Message | { messages: Message[] }>;
  tokens: {
    anthropic?: string;
    mistral?: string;
    openai?: string;
  };
};

export const getInitialStore = (): Store => ({
  tokens: {},
  experiments: {},
});
export const storeAtom = divergentAtom(
  () => {
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
  },
  () => {
    if (hasBackend()) {
      return atom<Store>(getInitialStore());
    }
  },
  () => {
    return atomWithStorage<Store>(
      "store",
      getInitialStore(),
      createJSONStorage(() => localStorage),
      {
        getOnInit: true,
      },
    );
  },
);

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

export const isBoldTextAtom = entangledAtom(
  "isBoldText",
  focusAtom(storeAtom, (o) => o.prop("isBoldText")),
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

export const templatesAtom = entangledAtom(
  "templates",
  focusAtom(storeAtom, (o) => o.prop("templates")),
);

export const experimentLayoutAtom = entangledAtom(
  "experimentLayout",
  focusAtom(storeAtom, (o) => o.prop("experimentLayout")),
);

export const parentAtom = entangledAtom("parent", atom<string | undefined>(undefined));

export const rendererModeAtom = entangledAtom(
  "rendererMode",
  focusAtom(storeAtom, (o) => o.prop("rendererMode").valueOr("markdown")),
);

export const hasOpensslAtom = entangledAtom(
  "hasOpenssl",
  atom(async () => {
    const result = await spawn("which", ["openssl"]);
    return result.isOk && result.value !== "";
  }),
);
