export const getClientAsString = async () => {
  const {
    outputs: [js],
    success,
    logs,
  } = await Bun.build({
    entrypoints: ["src/entry/client.tsx"],
  });
  if (!success) {
    throw new Error(logs.join("\n"));
  }
  return js.text();
};
