import { Routes, Route } from "react-router-dom";
import Import from "./Import";
import NewExperiment from "./NewExperiment";
import Parameters from "./Parameters";
import Experiment from "./Experiment";
import Templates from "./Templates";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<NewExperiment />} />
      <Route path="/import" element={<Import />} />
      <Route path="/experiment/:id/:runId" element={<Experiment />} />
      <Route path="/parameters" element={<Parameters />} />
      <Route path="/templates" element={<Templates />} />
    </Routes>
  );
};
