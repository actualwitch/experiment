import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useHydrateAtoms } from "jotai/utils";
import { DEBUG } from "~/const";
import { View } from "~/dbg";
import {
  appendToRun,
  ExperimentCursor,
  getExperimentAtom,
  Message,
  newChatAtom,
  store
} from "~/state/common";
import { Message as MessageComponent } from "~/style";

const Msg = ({ message }: { message: Message }) => {
  return (
    <MessageComponent role={message.role} ioType={message.fromServer ? "output" : "input"} isSelected={false}>
      {typeof message.content === "string" ? <code>{message.content}</code> : <View>{message.content}</View>}
    </MessageComponent>
  );
};

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
  const navigate = useNavigate();
  useHydrateAtoms([[cursor, { id, runId }] as any, [experimentAtom, loaderData.experiment] as any]);
  const [experiment] = useAtom(experimentAtom);
  
  useAtom(subscription);
  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        {experiment?.map((message: Message, idx: number) => (
          <Msg key={idx} message={message} />
        ))}
      </div>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            store.set(newChatAtom, experiment.filter((msg) => !msg.fromServer));
            navigate("/");
          }}>
          Use in new experiment
        </button>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
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
