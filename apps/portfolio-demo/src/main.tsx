import "@kerb/react/kerb.css";
import "@kerb/react/fonts.css";
import "@kerb/react/global.css";
import "./portfolio.css";
import { KerbProvider } from "@kerb/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KerbProvider storageKey="portfolio">
      <App />
    </KerbProvider>
  </StrictMode>,
);
