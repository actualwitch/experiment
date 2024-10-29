import { DEBUG } from "./const";
import { getRealm } from "./utils";

export const log = (...args: any[]) => {
  if (DEBUG) {
    console.log(`[${getRealm()}] `, ...args);
  }
};
