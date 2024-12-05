import { platform } from "node:os";

export const isMac = () => platform() === "darwin";
