import React, {useState} from "react";
import { Box, render, Text, useApp, useInput } from "../../../ink/build";
import process from "node:process";

const Counter = () => {
    console.error("Counter");
  const [counter, setCounter] = useState(0);
//   const { exit } = useApp();

//   React.useEffect(() => {
//     const timer = setInterval(() => {
//       setCounter((prevCounter) => prevCounter + 1);
//     }, 100);

//     return () => {
//       clearInterval(timer);
//     };
//   });


  return <Text color={"green"}> tests passed</Text>;
};

// const enterAltScreenCommand = "\x1b[?1049h";
// const leaveAltScreenCommand = "\x1b[?1049l";
// process.stdout.write(enterAltScreenCommand);
// process.on("exit", () => {
//   process.stdout.write(leaveAltScreenCommand);
// });

render(<Counter />);
