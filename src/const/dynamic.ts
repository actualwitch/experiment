import { version } from ".";

import { getReleaseHash } from "./_macro" with { type: "macro" };

// export const DEBUG = getDebug();

const hash = await getReleaseHash();

export const REVISION = `${version}-${hash}`;

// export const DEBUG = false;

// export const VERSION = version;
