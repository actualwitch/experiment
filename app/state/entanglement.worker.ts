import { createStore } from "jotai";
import { createMessageHandler, entangledAtoms } from "./common";

const store = createStore();
store.set(entangledAtoms.testAtom, 1);

globalThis.onmessage = createMessageHandler(store);
