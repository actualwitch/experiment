import { atom } from "jotai";

import makeRequestTool from "./makeRequestTool.json";

export { makeRequestTool };

export const toolsAtom = atom([makeRequestTool]);
