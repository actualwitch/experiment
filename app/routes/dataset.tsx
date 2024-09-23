import { useAtom } from "jotai";
import { templatesAtom } from "~/state/common";
import { View } from "~/view";

export { defaultMeta as meta } from "~/meta";

export default function Dataset() {
  const [templates] = useAtom(templatesAtom);
  return <View>{templates}</View>;
}
