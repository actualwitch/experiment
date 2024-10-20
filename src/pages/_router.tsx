import { Routes, Route } from "react-router-dom";
import { default as NewExperiment } from "./NewExperiment";
import { default as Parameters } from "./Parameters";
import Experiment from "./Experiment";


export const Router = () => {
    return (
      <Routes>
        <Route path="/" element={<NewExperiment />} />
        <Route path="/experiment/:id/:runId" element={<Experiment />} />
        <Route path="/parameters" element={<Parameters />} />
      </Routes>
    );
  };