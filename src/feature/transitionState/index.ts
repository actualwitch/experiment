export * from "./item";
export * from "./list";

export type Key = string | number;
export type TransitionState = "entering" | "entered" | "exiting" | "exited" | "moving";
export type WithTransitionState = {
  transitionState: TransitionState;
};
