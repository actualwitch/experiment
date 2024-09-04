export function createStore(): Partial<{
  isDarkMode: boolean;
  tokens: {
    anthropic: string;
  };
}> {
  return {};
}

export type Store = ReturnType<typeof createStore>;
