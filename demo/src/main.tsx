import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MetricDriverTreeStudio from "../../archive/phase-0/driver-tree-studio.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MetricDriverTreeStudio />
  </StrictMode>,
);
