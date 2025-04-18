import { Palette } from "../../style/palette";

export const getManifest = (name: string, description: string, iconResolutions: number[], baseUrl?: string) => ({
  name,
  description,
  start_url: `${baseUrl ?? ""}/`,
  display: "standalone",
  background_color: Palette.white,
  theme_color: Palette.black,
  icons: iconResolutions.map((res) => ({
    src: `experiment-${res}.png`,
    sizes: `${res}x${res}`,
    type: "image/png",
    purpose: "any maskable",
  })),
});
