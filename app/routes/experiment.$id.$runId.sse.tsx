import { LoaderFunctionArgs } from "@remix-run/node";
import { DEBUG } from "~/const";
import { eventStream } from "~/eventStream";
import { getExperimentAtom, store } from "~/state/common";

export { defaultMeta as meta } from "~/meta";

export async function loader({ request, params: { id, runId } }: LoaderFunctionArgs) {
  if (!id || !runId) {
    throw new Error("Invalid id or runId");
  }
  const atoms = {
    experiment: getExperimentAtom({ id, runId }),
  };
  return eventStream(request.signal, function setup(send) {
    const unsubMap = new Map<string, () => void>();
    for (const [key, atom] of Object.entries(atoms)) {
      const unsub = store.sub(atom, () => {
        const data = store.get(atom as any);
        if (DEBUG) {
          console.log("server>stream", { event: key });
        }
        send({ data: JSON.stringify(data), event: key });
      });
      unsubMap.set(key, unsub);
    }

    return () => {
      for (const unsub of unsubMap.values()) {
        unsub();
      }
    };
  });
}
