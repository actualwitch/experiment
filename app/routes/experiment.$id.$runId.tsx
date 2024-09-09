import React from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, useLoaderData, useSubmit } from "@remix-run/react";
import { atom } from "jotai";
// import { getExperimentAtom, store } from "~/state/server";
import { Debugger } from "~/dbg";
import { getExperimentAtom, store, type Experiment } from "~/state/common";
import { useSidebar } from "~/navigation";
import { createPortal } from "react-dom";
import { Message } from "~/style";

export async function loader({ params: { id, runId } }: LoaderFunctionArgs) {
  if (id && runId) {
    const experiment = store.get(getExperimentAtom(id, runId));

    return json({ id, runId, experiment });
  }
  return json({ id, runId, experiment: [], runs: [] as string[] });
}

export default function Experiment() {
  const { id, runId,  experiment } = useLoaderData<typeof loader>();
  const sidebar = useSidebar();
  const submit = useSubmit();
  return (
    <>
      <div>
        <h1>Experiment {id}.{runId}</h1>
        {experiment?.map(({ role, content }: any) => (
          <Message role={role}>
            <code>{content}</code>
          </Message>
        ))}
      </div>
      <aside>
        <h3>Actions</h3>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            submit([id!, experiment?.filter((msg) => ["system", "user"].includes(msg!.role)) ?? []], {
              method: "post",
              action: "/inference",
              encType: "application/json",
              navigate: false,
            });
          }}>
          Send it
        </button>
      </aside>
    </>
  );
}
