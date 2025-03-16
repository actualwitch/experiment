import project from "../package.json";

export const { name, description, author, version } = project;

export const clientFile = "/client.js";
export const staticDir = "static";

export const schema = "http";
export const hostname = "localhost";
export const port = 5173;
export const url = `${schema}://${hostname}:${port}`;

export const iconResolutions = [128, 192, 256, 512, 1024];

export const TRIANGLE = "▴";

export const tokenLimit = 8192;

export const newLine = `
`;
