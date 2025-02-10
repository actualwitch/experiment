export const getClientAsString = async (entry = "src/entry/client.tsx") => {
  const {
    outputs: [js, ...outputs],
  } = await Bun.build({
    entrypoints: [entry],
    throw: true,
  });
  console.log(`Emitted 1+${outputs.length} files`);
  if (outputs.length) {
    console.log(outputs);
  }
  return js.text();
};
