import { useState, useEffect } from "react";
import { htmlEscape } from "./escape";
import { getRealm } from ".";

export const HYDRATION: unique symbol = Symbol.for("hydration");
type HydrationMap = Record<string, unknown>;
export const hydrationMap: HydrationMap =
  getRealm() === "server"
    ? {}
    : (window as typeof window & { [HYDRATION]?: HydrationMap })[HYDRATION] ||
      {};

export const Hydration = () => {
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    setHasLoaded(true);
  }, []);
  if (hasLoaded) {
    return null;
  }
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `window[Symbol.for("hydration")] = JSON.parse(${htmlEscape(
          JSON.stringify(JSON.stringify(hydrationMap))
        )});`,
      }}
    />
  );
};
