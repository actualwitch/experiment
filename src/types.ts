import { Union, Literal, type Static } from "runtypes";

export type StringContent = { content: string };
export type ObjectOrStringContent = { content: object | string };

export const StringType = Union(Literal("system"), Literal("developer"), Literal("user"));
export const ObjectOrStringType = Union(Literal("assistant"), Literal("info"), Literal("tool"));

export type _Message =
  | ({ role: Static<typeof StringType> } & StringContent)
  | ({ role: Static<typeof ObjectOrStringType> } & ObjectOrStringContent);

export type WithIdentity = { name?: string };
export type WithDirection = { fromServer?: boolean };
export type WithTemplate = {
  template?: string;
};

export type Message = _Message & WithDirection & WithTemplate & WithIdentity;

export type Role = "system" | "developer" | "user" | "assistant" | "tool" | "info";

export type ExperimentWithMeta = {
  id?: string;
  messages: Message[];
  timestamp?: string;
  model?: string;
  summary?: string;
};

export type Experiment = Message[] | ExperimentWithMeta;

export type SerialExperiment = {
  [runId: string]: Experiment;
};

export type Nullish = null | undefined;
