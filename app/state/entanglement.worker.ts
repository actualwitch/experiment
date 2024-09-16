import { createStore } from "jotai";
import { createMessageHandler, entangledAtoms } from "./common";

const store = createStore();

globalThis.onmessage = createMessageHandler(store);
