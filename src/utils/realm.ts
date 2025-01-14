let realmOverride: string | null = null;

export const getRealm = () => {
  if (realmOverride) {
    return realmOverride;
  }
  if (typeof document !== "undefined") {
    if (window?.[Symbol.for("REALM")] === "TESTING") {
      return "testing";
    }
    if (window?.[Symbol.for("REALM")] === "SPA") {
      return "spa";
    }
    return "client";
  }
  if (typeof process === "object") {
    if (process.env.REALM === "spa") {
      return "spa";
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

export const isClient = () => ["client", "spa", "testing"].includes(getRealm());
export const hasBackend = () => getRealm() === "client";
