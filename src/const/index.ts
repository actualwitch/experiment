import project from "../../package.json";

export const { name, description, author, version } = project;

export const clientFile = "/client.js";
export const clientCss = "/client.css";
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

export const PRONOUNS = ["she/her", "they/them", "he/him", "it/its", "ze/zir", "fae/faer"];
export const CUSTOM_OPTION = "( custom )";
// what's up tack? haha falsum
export const BOTTTOM_OPTION = "( empty )";
