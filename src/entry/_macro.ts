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
  console.log(`Emitted 1+${outputs.length} files`);
  if (outputs.length) {
    console.log(outputs);
  }
  return js.text();
};
