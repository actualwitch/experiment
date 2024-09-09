import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Debugger } from "~/dbg";
import { getExperimentAtom, Message, store } from "~/state/common";
import { Message as MessageComponent } from "~/style";

export async function loader({ params: { id, runId } }: LoaderFunctionArgs) {
  if (id && runId) {
    const experiment = store.get(getExperimentAtom(id, runId));

    return json({ id, runId, experiment });
  }
  return json({ id, runId, experiment: [] as Message[], runs: [] as string[] });
}

const Msg = ({ message }: { message: Message }) => {
  return (
    <MessageComponent role={message.role}>
      {typeof message.content === "string" ? <code>{message.content}</code> : <Debugger>{message.content}</Debugger>}
    </MessageComponent>
  );
};

export default function Experiment() {
  const { id, runId, experiment } = useLoaderData<typeof loader>();
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
            submit([id!, experiment?.filter((msg) => ["system", "user"].includes(msg!.role)) ?? [] as any], {
              method: "post",
              action: "/inference",
              encType: "application/json",
              navigate: false,
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
