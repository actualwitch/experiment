import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams, useSubmit } from "@remix-run/react";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useHydrateAtoms } from "jotai/utils";
import { DEBUG } from "~/const";
import { Debugger } from "~/dbg";
import {
  appendToRun,
  ExperimentCursor,
  getExperimentAtom,
  intervalAppend,
  Message,
  store
} from "~/state/common";
import { Message as MessageComponent } from "~/style";

const Msg = ({ message }: { message: Message }) => {
  return (
    <MessageComponent role={message.role} fromServer={message.fromServer} isSelected={false}>
      {typeof message.content === "string" ? <code>{message.content}</code> : <Debugger>{message.content}</Debugger>}
    </MessageComponent>
  );
};

const cursor = atom<ExperimentCursor | null>(null);
const experimentAtom = atom<Message[]>([]);
const atoms = {
  cursor,
  experiment: experimentAtom,
  laughingAtom: atom(null, (get, set, cursor: ExperimentCursor) => {
    const idx = set(appendToRun, cursor, [{ role: "assistant", content: "" }]);
    set(intervalAppend, cursor, idx);
  }),
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
  useHydrateAtoms([[cursor, { id, runId }] as any, [experimentAtom, loaderData.experiment] as any]);
  const [experiment] = useAtom(experimentAtom);
  console.log("experiment", experiment);
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
            submit({ laughingAtom: { id, runId } } as any, {
              action: "/portal",
              method: "post",
              encType: "application/json",
              navigate: false,
            });
          }}>
          :D
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
