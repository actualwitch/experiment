import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { ChatPreview } from "~/chat";
import { getExperimentAtom, Message, newChatAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";

const experimentAtom = atom<Message[]>([]);

export async function loader({ request, params: { id, runId } }: LoaderFunctionArgs) {
  if (id && runId) {
    const experiment = store.get(getExperimentAtom({ id, runId }));
    return json({ experiment });
  }
}

export default function Experiment() {
  const submit = useSubmit();
  const { id, runId } = useParams();
  const { experiment } = useLoaderData<typeof loader>();
  useEffect(() => {
    if (experiment) {
      store.set(experimentAtom, experiment);
    }
  }, [experiment]);
  const navigate = useNavigate();
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
