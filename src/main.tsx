import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { initPostHog } from "./lib/posthog";
import App from "./App.tsx";
import "./index.css";

initPostHog();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
