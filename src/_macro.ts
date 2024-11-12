import { $ } from "bun";

export async function getReleaseHash() {
  return await $`git rev-parse HEAD`.text();
}

export function getDebug() {
  return process.env.DEBUG === "true";
}
