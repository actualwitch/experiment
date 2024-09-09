import { ActionFunctionArgs, json } from "@remix-run/node";

import {
    deleteExperiment,
    runExperiment,
    store
} from "~/state/common";

export async function action({ request }: ActionFunctionArgs) {
  const atoms = await request.json();
  if (atoms.deleteExperiment) {
    store.set(deleteExperiment, atoms.deleteExperiment);
  }
  if (atoms.runExperiment) {
    store.set(runExperiment, undefined, atoms.runExperiment);
  }

  return json({ result: "ok" });
}
