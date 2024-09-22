import { useAtom } from "jotai";
import { View } from "~/dbg";
import { entangledAtoms, store, templatesAtom } from "~/state/common";

export default function Dataset() {
  const [templates] = useAtom(templatesAtom);
  return <View>{templates}</View>;
}
