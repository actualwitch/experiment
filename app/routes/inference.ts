import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createExperiment, experimentIdsAtom, store } from "~/state/common";
import { testStreaming } from "~/state/server";

export async function loader({}: LoaderFunctionArgs) {
  store.get(experimentIdsAtom);
  return json({ result: "ok" });
}

export async function action({ request }: ActionFunctionArgs) {
  const experiment = await request.json();
  const { id, runId } = await store.set(createExperiment, experiment);
  store.set(testStreaming, { id, runId });

  return redirect(`/experiment/${id}/${runId}`);
}
