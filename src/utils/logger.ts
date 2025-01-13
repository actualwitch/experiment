import { DEBUG } from "../const/dynamic";

export const log = (...args: any[]) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(timestamp, ...args);
  }
};
