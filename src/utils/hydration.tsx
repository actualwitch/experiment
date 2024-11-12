import { useState, useEffect } from "react";
import { htmlEscape } from "./escape";
import { getRealm } from ".";

type HydrationMap = Record<string, unknown>;

const id = "hydration";
export const HYDRATION: unique symbol = Symbol.for(id);
export const hydrationMap: HydrationMap =
  (getRealm() === "client" && (window as typeof window & { [HYDRATION]?: HydrationMap })[HYDRATION]) || {};

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
        __html: `window[Symbol.for("${id}")] = JSON.parse(${htmlEscape(
          JSON.stringify(JSON.stringify(hydrationMap)),
        )});`,
      }}
    />
  );
};
