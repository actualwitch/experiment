import { readFile } from "node:fs/promises";
import path from "node:path";

export async function getBackendAsString(type: "mlx" = "mlx") {
  const file = path.join(Bun.env.PWD || "", `backends/${type}.py`);
  const backend = await readFile(file, { encoding: "utf8" });
  return backend;
}
