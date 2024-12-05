export const getClientAsString = async (entry = "src/entry/client.tsx") => {
  const {
    outputs: [js, ...outputs],
    success,
    logs,
  } = await Bun.build({
    entrypoints: [entry],
  });
  if (!success) {
    throw new Error(logs.join("\n"));
  }
  console.log(`Emitted ${outputs.length} files`, outputs);
  return js.text();
};
