import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { View } from "~/dbg";
import {
  getExperimentAtom,
  Message,
  newChatAtom,
  store
} from "~/state/common";
import { Message as MessageComponent } from "~/style";

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
  const navigate = useNavigate();
  return (
    <>
      <div>
        <h1>
          Experiment {id}.{runId}
        </h1>
        {experiment?.map((message: Message, idx: number) => (
          <MessageComponent
            key={idx}
            role={message.role}
            ioType={message.fromServer ? "output" : "input"}
            isSelected={false}>
            {typeof message.content === "string" ? <code>{message.content}</code> : <View>{message.content}</View>}
          </MessageComponent>
        ))}
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
