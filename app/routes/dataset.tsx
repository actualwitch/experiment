import { useAtom } from "jotai";
import { templatesAtom } from "~/state/common";
import { View } from "~/view";

export default function Dataset() {
  const [templates] = useAtom(templatesAtom);
  return <View>{templates}</View>;
}
