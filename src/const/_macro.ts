import { $ } from "bun";

export async function getReleaseHash() {
  const hash = await $`git rev-parse HEAD`.text();

  return hash.slice(0, 8);
}

export function getDebug() {
  return process.env.DEBUG === "true";
}
