export const getClientAsString = async (entry = "src/entry/client.tsx") => {
  const {
    outputs: [js],
    success,
    logs,
  } = await Bun.build({
    entrypoints: [entry],
  });
  if (!success) {
    throw new Error(logs.join("\n"));
  }
  return js.text();
};
