import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./styles/glowing-effects.css";
import "./styles/light-theme-override.css"; // Import light theme overrides
import queryClient from "./lib/reactQueryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);