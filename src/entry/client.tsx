import { hydrateRoot } from "react-dom/client";
import { Shell } from "../root";
import { BrowserRouter } from "react-router-dom";
import { startTransition } from "react";

startTransition(() => {
  hydrateRoot(
    document,
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
});
