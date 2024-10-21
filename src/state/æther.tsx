import { getRealm } from "../utils";

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

export const publish = (update: { id: string; value: unknown }) => {
  console.log(`${getRealm()} is publishing ${update.id} update`);
  for (const listener of listeners) {
    listener(update);
  }
};
