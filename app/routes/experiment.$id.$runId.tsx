import { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { createEntanglement, entangledResponse } from "~/again";
import { ChatPreview } from "~/chat";
import { getExperimentAtom, Message, newChatAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";

const experimentAtom = atom<Message[]>([]);
const atoms = { experimentAtom };

export async function loader({ request, params: { id, runId } }: LoaderFunctionArgs) {
  let experiment: Message[] = [];
  if (id && runId) {
    experiment = store.get(getExperimentAtom({ id, runId })) ?? [];
    store.set(experimentAtom, experiment);
  }
  return entangledResponse(atoms);
}

const useEntangledAtoms = createEntanglement(atoms);

export default function Experiment() {
  const submit = useSubmit();
  const navigate = useNavigate();
  const { id, runId } = useParams();
  useEntangledAtoms();
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
