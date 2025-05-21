import { log } from "./logger";

export const æther = "æther";

export type Update = { id: string; value: unknown };
type Listener = (update: Update) => void;

const listeners = new Set<Listener>();

export const subscribe = (listener: (update: Update) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const sentMap = new WeakMap<WeakKey, true>();

export const publish = (update: { id: string; value: unknown }) => {
  log(`publishing ${JSON.stringify(update, null, 2)}`);
  if (update.value && typeof update.value === "object") {
    if (sentMap.get(update.value)) return;
    sentMap.set(update.value, true);
  }
  for (const listener of listeners) {
    listener(update);
  }
};
