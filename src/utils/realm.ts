

export const getRealm = () => {
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
    return "server";
  }
  // @ts-ignore
  if (typeof importScripts === "function") {
    return "worker";
  }
  throw new Error("Unknown realm");
};

export const isClient = () => ["client", "spa", "testing"].includes(getRealm());