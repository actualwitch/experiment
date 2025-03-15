import { atomEffect } from "jotai-effect";
import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Result } from "true-myth";

import { createFileStorage, getStoragePath, resolve, spawn } from "../utils";
import { divergentAtom, entangledAtom } from "../utils/entanglement";
import { getRealm, hasBackend } from "../utils/realm";
import { author, newLine, version } from "../const";
import type { _Message, SerialExperiment, ExperimentWithMeta, Message, Persona } from "../types";
import { modelLabels, type ProviderType } from "../feature/inference/types";
import type { FONT_STACKS } from "../style";

export type LayoutType = "mobile" | "desktop";
export const layoutAtom = atom<LayoutType>();
export const mobileQuery = "(max-width: 920px)";
export const desktopQuery = "(min-width: 921px)";

export const tracingAtom = (a: any) => atom(get => {
  const value = get(a);
  console.log("getting ", JSON.stringify(value));
  return value;
}, (get, set, ...value) => {
  console.log("setting ", JSON.stringify(value));
  set(a, ...value);
})

export type Path = [number] | [number, "content"];
export const selectionAtom = entangledAtom("selection", atom<Path | []>([]));

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

export type Store = {
  isDarkMode?: boolean;
  isBoldText?: boolean;
  fontStack?: keyof typeof FONT_STACKS;
  experimentLayout?: "left" | "chat" | "chat-reverse";
  isTransRights?: boolean;
  selectedProvider?: ProviderType;
  selectedModel?: string;
  experiments?: Record<string, SerialExperiment>;
  personas?: Record<string, Persona>;
  templates?: Record<string, _Message | ExperimentWithMeta>;
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
    if (getRealm() === "client") {
      return atom<Store>(getInitialStore());
    }
  },
  () => {
    try {
      return atomWithStorage<Store>(
        "store",
        getInitialStore(),
        createJSONStorage(() => localStorage),
        {
          getOnInit: true,
        },
      );
    } catch (e) {
      console.error(e);
      return atom<Store>(getInitialStore());
    }
  },
);

export const experimentAtom = entangledAtom("experiment", atom<Message[]>([]));
export const selectedProviderAtom = entangledAtom(
  "selected-provider",
  focusAtom(storeAtom, (o) => o.prop("selectedProvider")),
);
export const modelAtom = entangledAtom(
  "model",
  focusAtom(storeAtom, (o) => o.prop("selectedModel")),
);

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

export const fontStackAtom = entangledAtom(
  "fontStack",
  focusAtom(storeAtom, (o) => o.prop("fontStack")),
);

export const isDarkModeAtom = entangledAtom(
  "isDarkMode",
  focusAtom(storeAtom, (o) => o.prop("isDarkMode")),
);

export const isTransRightsAtom = entangledAtom(
  "isTransRights",
  focusAtom(storeAtom, (o) => o.prop("isTransRights")),
);

export type ExperimentCursor = { id: string; runId: string };

export const createExperiment = atom(
  null,
  (get, set, messages?: Message[], id?: string, runId?: string): ExperimentCursor => {
    const exp = get(experimentsAtom) ?? {};

    const parent = get(parentAtom);
    id ??= parent;

    id ??= String(Object.keys(exp).length + 1);

    const thisExperiment = exp[id] ?? {};
    runId ??= String(Object.keys(thisExperiment).length + 1);

    const provider = get(selectedProviderAtom);
    const model = get(modelAtom);
    const modelName = provider && model && modelLabels[provider][model];

    set(experimentsAtom, (prev) => ({
      ...prev,
      [id]: {
        ...thisExperiment,
        [runId]: {
          messages: messages ?? [],
          timestamp: new Date().toISOString(),
          model: modelName,
        },
      },
    }));

    return { id, runId };
  },
);

export const templatesAtom = entangledAtom(
  "templates",
  focusAtom(storeAtom, (o) => o.prop("templates")),
);

export const experimentLayoutAtom = entangledAtom(
  "experimentLayout",
  focusAtom(storeAtom, (o) => o.prop("experimentLayout")),
);

export const parentAtom = entangledAtom("parent", atom<string | undefined>(undefined));

export const hasOpensslAtom = atom(async () => {
  const result = await spawn("which", ["openssl"]);
  return result.isOk && result.value !== "";
});

export const localCertAndKeyAtom = atom(async () => {
  if (getRealm() !== "server") return Result.err(new Error("Cannot generate certificates in the browser"));
  const fs = await resolve("fs/promises");
  if (fs.isErr) {
    return Result.err(new Error("Cannot generate certificates in the browser"));
  }
  const exists = fs.value.exists;
  const writeFile = fs.value.writeFile;
  const opensslBinary = await spawn("which", ["openssl"]);
  if (opensslBinary.isErr) {
    return Result.err(new Error("OpenSSL is not installed"));
  }
  const hasKey = await exists(`${getStoragePath()}/cert.key`);
  if (!hasKey) {
    const result = await spawn(opensslBinary.value, ["genrsa", "4096"]);
    if (result.isErr) {
      return Result.err(new Error("Failed to generate private key"));
    }
    await writeFile(`${getStoragePath()}/cert.key`, result.value + newLine);
  }
  const hasCert = await exists(`${getStoragePath()}/key.cert`);
  if (!hasCert) {
    const result = await spawn(opensslBinary.value, [
      "req",
      "-new",
      "-x509",
      "-noenc",
      "-sha256",
      "-days",
      "365",
      "-key",
      `${getStoragePath()}/cert.key`,
      "-out",
      `${getStoragePath()}/key.cert`,
      "-subj",
      `/C=NL/ST=Noord-Holland/L=Amsterdam/O=${author}/CN=actualwitch.me/emailAddress=noreply@actualwitch.me`,
    ]);
    if (result.isErr) {
      return Result.err(new Error("Failed to generate certificate"));
    }
  }
  return Result.ok({ key: `${getStoragePath()}/cert.key`, cert: `${getStoragePath()}/key.cert` });
});

export const revisionAtom = entangledAtom(
  "revision",
  atom(async (get) => {
    const result = await spawn("git", ["rev-parse", "HEAD"]);
    const hash = result.map((hash) => hash.slice(0, 6));
    const revision = [version, hash.unwrapOr(undefined)].filter(Boolean).join("-");
    return revision;
  }),
);

export const debugAtom = entangledAtom(
  "debug",
  atom(() => {
    if (getRealm() !== "server") return false;
    return process.env.DEBUG === "true";
  }),
);

export const nopeAtom = atom((get) => null);
