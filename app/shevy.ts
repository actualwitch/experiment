import Shevy from "shevyjs";

const config: {
  fontScale: "majorSecond" | "minorThird" | "majorThird" | "perfectFourth" | "augmentedFourth";
} = {
  fontScale: "minorThird"
}

export const tryShevy = () => {
  if (typeof window === "undefined") {
    // @ts-expect-error just pretend this is not here 🫣
    return Shevy.default(config);
  }
  return Shevy(config);
};
