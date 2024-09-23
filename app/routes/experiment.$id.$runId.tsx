import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useEffect } from "react";
import { ChatPreview } from "~/chat";
import { DEBUG } from "~/const";
import { appendToRun, ExperimentCursor, getExperimentAtom, Message, newChatAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";

const cursor = atom<ExperimentCursor | null>(null);
const experimentAtom = atom<Message[]>([]);
const atoms = {
  cursor,
  experiment: experimentAtom,
};
export async function loader({ request, params: { id, runId } }: LoaderFunctionArgs) {
  let values: Partial<Record<keyof typeof atoms, any>> = {};
  if (id && runId) {
    values["experiment"] = store.get(getExperimentAtom({ id, runId }));
  }
  if (DEBUG) {
    console.log("server>batch", values);
  }
  return json(values);
}
const subscription = atomEffect((get, set) => {
  const { id, runId } = get(cursor) ?? {};
  const url = `/experiment/${id}/${runId}/sse`;
  const source = new EventSource(url);
  const atoms = {
    experiment: experimentAtom,
  };
  for (const keyVal of Object.entries(atoms)) {
    const [key, atom] = keyVal;
    source.addEventListener(key, (event) => {
      console.log(`${url}>client/sse`, { [key]: JSON.parse(event.data) });

      store.set(atom as any, JSON.parse(event.data));
    });
  }
  source.onerror = (event) => {
    console.error(event);
  };
  return () => {
    source.close();
  };
});

export const action = async ({ request, params: { id, runId } }: ActionFunctionArgs) => {
  const body = await request.json();
  store.set(appendToRun, { id: id!, runId: runId! }, [{ role: "assistant", content: "Are you still there?" }]);
  return json({ result: "ok" });
};

export default function Experiment() {
  const submit = useSubmit();
  const { id, runId } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  useEffect(() => {
    if (loaderData.experiment) {
      store.set(experimentAtom, loaderData.experiment);
    }
  }, []);
  const navigate = useNavigate();

  useAtom(subscription);
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
            const experiment = store.get(experimentAtom);
            store.set(
              newChatAtom,
              experiment.filter((msg) => !msg.fromServer),
            );
            navigate("/");
          }}>
          Use in new experiment
        </button>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            const experiment = store.get(experimentAtom);
            submit(experiment as any, {
              method: "post",
              encType: "application/json",
            });
          }}>
          Send it
        </button>
      </aside>
    </>
  );
}
