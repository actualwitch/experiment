import { DEBUG } from "../const";

export const log = (...args: any[]) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(timestamp, ...args);
  }
};
