import { $ } from "bun";
import project from "../package.json";

const tag = `v${project.version}`;
await $`git tag -a ${tag} -m ${tag} -s`;
await $`git push origin ${tag}`;
