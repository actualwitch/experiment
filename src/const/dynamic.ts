import { version } from ".";
// import { getDebug, getReleaseHash } from "./_macro" with { type: "macro" };

// export const DEBUG = getDebug();
// const hash = await getReleaseHash();
// export const VERSION = `${version}-${hash}`;

export const DEBUG = false;
export const VERSION = version;
