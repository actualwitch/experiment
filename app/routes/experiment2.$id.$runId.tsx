import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useParams, useSubmit } from "@remix-run/react";
import { Debugger } from "~/dbg";
import {
  appendToRun,
  ExperimentCursor,
  getExperimentAtom,
  intervalAppend,
  Message,
  store,
  voidAtom,
} from "~/state/common";
import { Message as MessageComponent } from "~/style";
import { portalSubscription } from "./portal";
import { atomEffect } from "jotai-effect";
import { atom, useAtom } from "jotai";
import { useMemo } from "react";
import { createLoader } from "~/createLoader";
import { createController } from "~/createController";
import { DEBUG } from "~/const";
import { useHydrateAtoms } from "jotai/utils";

const Msg = ({ message }: { message: Message }) => {
  return (
    <MessageComponent role={message.role}>
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
  const url = `/experiment2/${id}/${runId}/sse`;
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

export default function Experiment() {
  const submit = useSubmit();
  const { id, runId } = useParams();
  const loaderData = useLoaderData<typeof loader>();
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
            submit({ laughingAtom: { id, runId } } as any, {
              action: "/portal",
              method: "post",
              encType: "application/json",
              navigate: false,
            });
          }}>
          :D
        </button>
      </aside>
    </>
  );
}
