import { match } from "ts-pattern";

const jsAsset = "./client.js";
const cssAsset = "./client.css";

export const getClientAsString = async (entry = "src/entry/client.tsx") => {
  const { outputs } = await Bun.build({
    entrypoints: [entry],
    throw: true,
  });
  const assets = await Promise.all(
    outputs.map(async (asset) => {
      return {
        name: asset.type,
        type: match(asset.path)
          .with(jsAsset, () => "JS")
          .with(cssAsset, () => "CSS")
          .otherwise(() => "???"),
        text: await asset.text(),
      };
    }),
  );
  console.log(`Emitted: ${assets.map((asset) => asset.type).join(" ")}`);
  return assets;
};
