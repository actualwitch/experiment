import { Union, Literal, type Static } from "runtypes";

export type StringContent = { content: string };
export type ObjectOrStringContent = { content: object | string };
export type ObjectContent = { content: object };

export const StringType = Union(Literal("system"), Literal("developer"), Literal("user"));
export const ObjectOrStringType = Union(Literal("assistant"), Literal("info"), Literal("tool"), Literal("error"));
export const ObjectType = Union(Literal("context"));

export const PossibleObjectType = Union(...ObjectType.alternatives, ...ObjectOrStringType.alternatives);

export type _Message =
  | ({ role: Static<typeof StringType> } & StringContent)
  | ({ role: Static<typeof ObjectOrStringType> } & ObjectOrStringContent)
  | ({ role: Static<typeof ObjectType> } & ObjectContent);

export type WithIdentity = { name?: string; pronouns?: string };
export type WithDirection = { fromServer?: boolean };
export type WithTemplate = {
  template?: string;
};
export type WithTimestamp = { timestamp?: string };

export type Message = _Message & WithDirection & WithTemplate & WithIdentity & WithTimestamp;

export type Role = "system" | "developer" | "user" | "assistant" | "tool" | "info" | "context" | "error";

export const RoleOptions = Union(
  ...StringType.alternatives,
  ...ObjectOrStringType.alternatives,
  ...ObjectType.alternatives,
);

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

export type Persona = {
  id: string;
  role: string;
  context: Record<string, unknown>;
  systemMessage: string;
};

export type ExperimentFunction = {
  name: string;
  description: string;
  schema: Record<string, unknown>;
};
