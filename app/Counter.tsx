import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { entangledAtoms } from "./state/common";

const sseSubscriptionEffect = atomEffect((get, set) => {
  const source = new EventSource("/portal");
  for (const keyVal of Object.entries(entangledAtoms)) {
	const [key, atom] = keyVal;
	source.addEventListener(key, (event) => {
	  set(atom as any, JSON.parse(event.data));
	});
  }
  return () => {
	source.close();
  }
});

export function Counter() {
  const [time] = useAtom(entangledAtoms.timeAtom);
  useAtom(sseSubscriptionEffect);

  if (!time) return null;

  return (
    <time dateTime={time}>
      {new Date(time).toLocaleTimeString("en", {
        minute: "2-digit",
        second: "2-digit",
        hour: "2-digit",
      })}
    </time>
  );
}
