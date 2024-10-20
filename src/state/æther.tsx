/*
* Not sure if spec didn't expect this usage or bun specific bug, but same channel can't be used in duplex mode
* */
export const createChannel = (name = "æther") => {
  return [new BroadcastChannel(name), new BroadcastChannel(name)] as [input: BroadcastChannel, output: BroadcastChannel];
};