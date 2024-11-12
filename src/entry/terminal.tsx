import React, { useState } from "react";
import { Box, render, Text, useApp, useInput } from "../../../ink/build";
import process from "node:process";

// it seems ink needs to be upgraded to support react 19 and as it uses a custom reconciler that is not trivial

const Terminal = () => {
  const { exit } = useApp();

  return <Text color={"green"}>Success</Text>;
};

const enterAltScreenCommand = "\x1b[?1049h";
const leaveAltScreenCommand = "\x1b[?1049l";
process.stdout.write(enterAltScreenCommand);
process.on("exit", () => {
  process.stdout.write(leaveAltScreenCommand);
});

render(<Terminal />);
