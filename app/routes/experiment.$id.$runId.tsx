import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useParams, useSubmit } from "@remix-run/react";
import { Debugger } from "~/dbg";
import { appendToRun, ExperimentCursor, getExperimentAtom, Message, store, voidAtom } from "~/state/common";
import { Message as MessageComponent } from "~/style";
import { portalSubscription } from "./portal";
import { atomEffect } from "jotai-effect";
import { useAtom } from "jotai";
import { useMemo } from "react";

export async function loader({ params: { id, runId }, request }: LoaderFunctionArgs) {
  if (!id || !runId) {
    return redirect("/");
  }

  const experiment = store.get(getExperimentAtom({ id, runId }));
  // if (request.headers.get("accept") === "text/event-stream") {
  //   return eventStream(request.signal, function setup(send) {
  //     const unsubMap = new Map<string, () => void>();
  //     for (const [key, atom] of Object.entries({ experimentAtom })) {
  //       const unsub = store.sub(atom, () => {
  //         const data = store.get(atom as any);
  //         send({ data: JSON.stringify(data), event: key });
  //       });
  //       unsubMap.set(key, unsub);
  //     }

  //     return () => {
  //       for (const unsub of unsubMap.values()) {
  //         unsub();
  //       }
  //     };
  //   });
  // }
  if (id && runId) {
    return json({ id, runId, experiment });
  }
  return json({ id, runId, experiment: [] as Message[] });
}

const Msg = ({ message }: { message: Message }) => {
  return (
    <MessageComponent role={message.role}>
      {typeof message.content === "string" ? <code>{message.content}</code> : <Debugger>{message.content}</Debugger>}
    </MessageComponent>
  );
};

// const sseSubscriptionEffect = atomEffect((get, set) => {
//   const source = new EventSource(window.location.href);
//   for (const keyVal of Object.entries(entangledAtoms)) {
// 	const [key, atom] = keyVal;
// 	source.addEventListener(key, (event) => {
// 	  set(atom as any, JSON.parse(event.data));
// 	});
//   }
//   return () => {
// 	source.close();
//   }
// });

// export const action = async ({ request, params: { id, runId } }: ActionFunctionArgs) => {
//   const body = await request.json();
//   store.set(appendToRun, { id: id!, runId: runId! }, [{ role: "assistant", content: "Are you still there?" }]);
//   return json({ result: "ok" });
// };

export default function Experiment() {
  const { experiment } = useLoaderData<typeof loader>();
  const { id, runId } = useParams();
  const submit = useSubmit();
  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        {experiment?.map((message, idx) => (
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
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            submit(
              { deleteExperiment: id! },
              {
                method: "post",
                action: "/gateway",
                encType: "application/json",
                navigate: false,
              },
            );
          }}>
          Delete it
        </button>
      </aside>
    </>
  );
}
