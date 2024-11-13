import { useAtom } from "jotai";
import { templatesAtom } from "../state/common";
import { View } from "../components/view";



export default function Templates() {
  const [templates] = useAtom(templatesAtom);
  return <View>{templates}</View>;
}