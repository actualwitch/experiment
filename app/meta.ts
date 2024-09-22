import { MetaFunction } from "@remix-run/react";

const title = "Experiment";
const description = "Experiment is a simple tool to facilitate prompt engineering.";

function getMeta(title: string, description: string): MetaFunction {
  ////💥
  return () => {
    return [{ title }, { name: "description", content: description }];
  };
}

const defaultMeta = getMeta(title, description);

export { defaultMeta, title, description, getMeta };
