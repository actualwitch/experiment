import { $ } from "bun";
import project from "../package.json";

const tag = `v${project.version}`;
await $`git push --delete origin ${tag}`;
await $`git tag --delete ${tag}`;
