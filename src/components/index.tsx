import { useSetAtom } from "jotai";
import { useNavigate } from "react-router";
import { experimentAtom, parentAtom } from "../atoms/common";
import { Button } from "../style";
import type { Experiment } from "../types";

export const ForkButton = ({ experiment, parent }: { experiment?: Experiment; parent?: string }) => {
  const setExoeriment = useSetAtom(experimentAtom);
  const setParent = useSetAtom(parentAtom);
  const navigate = useNavigate();
  return (
    <Button
      type="submit"
      onClick={() => {
        if (!experiment) return;
        const messages = Array.isArray(experiment) ? experiment : experiment.messages;
        setExoeriment(messages);
        if (parent) setParent(parent);
        navigate("/");
      }}
    >
      Fork Experiment
    </Button>
  );
};
