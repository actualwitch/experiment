import { store } from "../store";
import { debugAtom } from "../atoms/common";

export const log = (...args: any[]) => {
  if (store.get(debugAtom)) {
    const timestamp = new Date().toISOString();
    console.log(timestamp, ...args);
  }
};
