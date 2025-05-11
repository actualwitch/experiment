import { getBackendAsString } from "./macro" with { type: "macro" };

export const mlxBackend = await getBackendAsString();
