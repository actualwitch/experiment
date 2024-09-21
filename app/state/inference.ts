import { atom } from "jotai";

export const makeRequestTool = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "function",
  function: {
    name: "make_request",
    description: "Generates some random data for an http request to an api backend",
    // Describe parameters as json schema https://json-schema.org/understanding-json-schema/
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        pathParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        queryParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        body: {
          type: "string",
        },
        bodyType: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["json", "text", "form-data", "file"],
            },
            isMultipart: {
              type: "boolean",
            },
          },
        },
        headers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
      },
      // TODO - Mark fields like `pathParams` as required based on the route definition?
      required: ["path"],
    },
  },
} as const;

export const toolsAtom = atom([makeRequestTool]);