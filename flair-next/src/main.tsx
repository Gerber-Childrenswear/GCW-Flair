import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/campaigns.css";
import "./styles/rule-builder.css";
import "./styles/placement-picker.css";
import "./styles/analytics.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
