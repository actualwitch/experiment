import { getReleaseHash, getDebug } from "./_macro" with { type: "macro" };
import { version } from "../package.json";

export const DEBUG = getDebug();
const hash = await getReleaseHash();
export const VERSION = version + "-" + hash.slice(0, 8);
