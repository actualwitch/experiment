import project from "../../package.json";

export const clientFile = "/client.js";

export const schema = "http";
export const hostname = "localhost";
export const port = 5173;
export const url = `${schema}://${hostname}:${port}`;

export const name = project.name;
export const description = project.description;
export const author = project.author;
export const version = project.version;

export const iconResolutions = [128, 192, 256, 512, 1024];

export const TRIANGLE = "▴";
