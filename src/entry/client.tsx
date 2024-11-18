import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Shell } from "../root";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <BrowserRouter basename={window[Symbol.for("BASE_URL")]}>
        <Shell />
      </BrowserRouter>
    </StrictMode>,
  );
});
