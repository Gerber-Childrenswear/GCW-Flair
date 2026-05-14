import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Bootstrap grid only — gives us .container/.row/.col-* responsive
// scaffolding without the rest of Bootstrap's reset/buttons/forms (which
// would conflict with Nick's existing styles).
import "bootstrap/dist/css/bootstrap-grid.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/campaigns.css";
import "./styles/rule-builder.css";
import "./styles/placement-picker.css";
import "./styles/analytics.css";
import "./styles/settings-colors.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
