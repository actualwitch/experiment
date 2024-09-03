import { atom, type WritableAtom } from "jotai";

export type Storage = {
  isDarkMode: boolean;
  tokens: Partial<Record<"anthropic", string>>;
};

export type StorageAtom = WritableAtom<Storage | Promise<Storage>, [Storage], void>

export function createStorage(): Storage {
  return { tokens: {}, isDarkMode: false };
}

export function createLens<V extends object, K extends keyof V>(
  base: WritableAtom<V | Promise<V>, [V], void>,
  key: K,
): WritableAtom<Promise<V[K]>, [V[K]], void> {
  return atom<Promise<V[typeof key]>, [V[typeof key]], void>(
    async (get) => {
      const storage = await get(base);
      return storage[key];
    },
    async (get, set, newValue: V[typeof key]) => {
      const storage = await get(base);
      set(base, { ...storage, [key]: newValue });
    },
  );
}
