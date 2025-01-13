import { useSetAtom } from "jotai";
import { useNavigate } from "react-router";
import { experimentAtom, parentAtom, type Message } from "../atoms/common";
import { Button } from "../style";

export const ForkButton = ({ experiment, parent }: { experiment?: Message[]; parent?: string }) => {
  const setExoeriment = useSetAtom(experimentAtom);
  const setParent = useSetAtom(parentAtom);
  const navigate = useNavigate();
  return (
    <Button
      type="submit"
      onClick={() => {
        if (!experiment) return;
        setExoeriment(experiment);
        if (parent) setParent(parent);
        navigate("/");
      }}
    >
      Fork Experiment
    </Button>
  );
};
