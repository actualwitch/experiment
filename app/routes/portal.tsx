import { LoaderFunctionArgs } from "@remix-run/node";
import { entanglement } from "~/again";
import { eventStream } from "~/eventStream";

export async function loader({ request }: LoaderFunctionArgs) {
  return eventStream(request.signal, function setup(send) {
    const handler = (event: MessageEvent) => {
      const [key, value] = event.data;
      send({ data: JSON.stringify(value), event: key });
    };
    entanglement.addEventListener("message", handler);
    return () => {
      entanglement.removeEventListener("message", handler);
    };
  });
}
