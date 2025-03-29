import { useState, useEffect } from "react";
import { htmlEscape } from "./escape";
import { isClient } from "./realm";

type HydrationMap = Record<string, unknown>;

const id = "hydration";
export const HYDRATION: unique symbol = Symbol.for(id);
export const hydrationMap: HydrationMap =
  (isClient() && (window as typeof window & { [HYDRATION]?: HydrationMap })[HYDRATION]) || {};

export const assignToWindow = (id: string, value: string) => `window[Symbol.for("${id}")] = ${value};`;

export const createHydrationScript = (map: HydrationMap) => {
  return assignToWindow(id, `JSON.parse(${htmlEscape(JSON.stringify(JSON.stringify(map)))})`);
};

export const Hydration = () => {
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setHasLoaded(true);
    }, 100);
  }, []);
  if (hasLoaded) {
    return null;
  }
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: createHydrationScript(hydrationMap),
      }}
    />
  );
};
