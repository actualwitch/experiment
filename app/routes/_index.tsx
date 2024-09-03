import { MetaFunction } from "@remix-run/react";
import { Paragraph } from "~/style";

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};


export default function Index() {
  return (
    <div>
      <h2>Welcome</h2>
      <Paragraph>Experiment is a simple tool to facilitate prompt engineering. Start by importing a CSV or adding API keys.</Paragraph>
    </div>
  );
}
