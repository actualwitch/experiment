import { Union, Literal, type Static } from "runtypes";

export type StringContent = { content: string };
export type ObjectOrStringContent = { content: object | string };
export type Identity = { name: "string" };

export const StringType = Union(Literal("system"), Literal("developer"), Literal("user"));
export const ObjectOrStringType = Union(Literal("assistant"), Literal("info"), Literal("tool"));

export type _Message =
  | ({ role: Static<typeof StringType> } & StringContent & Partial<Identity>)
  | ({ role: Static<typeof ObjectOrStringType> } & ObjectOrStringContent & Partial<Identity>);

export type WithDirection = { fromServer?: boolean };
export type WithTemplate = {
  template?: string;
};

export type Message = _Message & WithDirection & WithTemplate;

export type Role = "system" | "user" | "assistant" | "tool";

export type ExperimentWithMeta = {
  id?: string;
  messages: Message[];
  timestamp?: string;
  model?: string;
};

export type Experiment = Message[] | ExperimentWithMeta;

export type SerialExperiment = {
  [runId: string]: Experiment;
};

export type Nullish = null | undefined;