import { readFile } from "node:fs/promises";

export async function getBackendAsString(type: "mlx" = "mlx") {
  const backend = await readFile(`backends/${type}.py`, { encoding: "utf8" });
  return backend;
}
