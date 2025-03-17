import { platform } from "node:os";

export const isMac = () => platform() === "darwin";

let realmOverride: string | null = null;

export const getRealm = () => {
  if (realmOverride) {
    return realmOverride;
  }
  if (typeof document !== "undefined") {
    if (window?.[Symbol.for("REALM")] === "TESTING") {
      return "testing";
    }
    if (window?.[Symbol.for("REALM")] === "SSG") {
      return "ssg";
    }
    return "client";
  }
  if (typeof process === "object") {
    if (process.env.REALM === "ssg") {
      return "ssg";
    }
    return "server";
  }
  // @ts-ignore
  if (typeof importScripts === "function") {
    return "worker";
  }
  throw new Error("Unknown realm");
};

export const setRealm = (realm: ReturnType<typeof getRealm>) => {
  realmOverride = realm;
};

export const isClient = () => ["client", "ssg", "testing"].includes(getRealm());
export const hasBackend = () => getRealm() === "client";
