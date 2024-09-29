import { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { createEntanglement, entangledResponse } from "~/again";
import { ChatPreview } from "~/chat";
import { getExperimentAtom, Message, newChatAtom, store, experimentAtom } from "~/state/common";
import { sendKeyValAtom } from "./portal";

export { defaultMeta as meta } from "~/meta";

const atoms = { experimentAtom };

const key = "experimentAtom";

export async function loader({ params: { id, runId } }: LoaderFunctionArgs) {
  let experiment: Message[] = [];
  if (id && runId) {
    const selectedExperiment = store.get(getExperimentAtom({ id, runId }));
    if (selectedExperiment) experiment = selectedExperiment;
    console.log({id, runId, selectedExperiment})
  }
  store.set(experimentAtom, experiment);
  return entangledResponse(atoms);
}

const {useEntangledAtoms, entanglementAtom, useSourceMachine} = createEntanglement(atoms);

export default function Experiment() {
  const submit = useSubmit();
  const navigate = useNavigate();
  const { id, runId } = useParams();
  useEntangledAtoms();
  useAtom(entanglementAtom);
  useSourceMachine();
  const [experiment] = useAtom(experimentAtom);
  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        <ChatPreview chatAtom={experimentAtom} />
      </div>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            store.set(
              newChatAtom,
              experiment!.filter((msg) => !msg.fromServer),
            );
            navigate("/");
          }}>
          new experiment
        </button>
      </aside>
    </>
  );
}
