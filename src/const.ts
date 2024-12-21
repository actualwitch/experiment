import { getReleaseHash, getDebug } from "./_macro" with { type: "macro" };
import project from "../package.json" with { type: "json" };

export const DEBUG = getDebug();
const hash = await getReleaseHash();
export const VERSION = `${project.version}-${hash}`;
export const clientFile = "/client.js";

export const schema = "http";
export const hostname = "localhost";
export const port = 5173;
export const url = `${schema}://${hostname}:${port}`;

export const title = project.name;
export const description = project.description;

export const TRIANGLE = "▴";
