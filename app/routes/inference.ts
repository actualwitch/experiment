import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import Client from "@anthropic-ai/sdk";

import { experimentIdsAtom, getExperimentAsAnthropic, runExperiment, store } from "~/state/common";
import { resolvedTokenAtom } from "~/state/server";

export async function loader({}: LoaderFunctionArgs) {
  await store.get(experimentIdsAtom);
  return json({ it: "works" });
}

export async function action({ request }: ActionFunctionArgs) {
  const [id, experiment] = await request.json();
  const runId = await store.set(runExperiment, id, experiment);
  const resolvedToken = await store.get(resolvedTokenAtom);

  if (resolvedToken) {
    const experimentAsAnthropic = store.get(getExperimentAsAnthropic(id, String(runId)));
    console.log("experimentAsAnthropic", experimentAsAnthropic);
    if (!experimentAsAnthropic) return json({ result: "ko" });
    const anthropic = new Client({ apiKey: resolvedToken });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 128,
      messages: experimentAsAnthropic.messages as any,
      system: experimentAsAnthropic.system,
    });
    await store.set(runExperiment, id, [
      ...experiment,
      ...response.content.map((contentBlock) => {
        if (contentBlock.type === "text") {
          return { role: "assistant", content: contentBlock.text };
        }
        if (contentBlock.type === "tool_use") {
          return { role: "tool", content: contentBlock };
        }
      }),
    ]);
  }

  return json({ result: "ok" });
}
