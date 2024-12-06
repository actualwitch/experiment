import { useSetAtom } from "jotai";
import { useNavigate } from "react-router";
import { experimentAtom, parentAtom, type Message } from "../state/common";

export const ForkButton = ({ experiment, parent }: { experiment?: Message[]; parent?: string }) => {
  const setExoeriment = useSetAtom(experimentAtom);
  const setParent = useSetAtom(parentAtom);
  const navigate = useNavigate();
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!experiment) return;
        e.preventDefault();
        setExoeriment(experiment);
        if (parent) setParent(parent);
        navigate("/");
      }}
    >
      fork experiment
    </button>
  );
};
