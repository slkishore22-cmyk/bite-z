import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalTapHaptics } from "./lib/haptics";
import { registerServiceWorker } from "./lib/pwa";

createRoot(document.getElementById("root")!).render(<App />);

// Native-app-feel: tiny vibration on every interactive tap (touch only).
installGlobalTapHaptics();

// Register the production service worker (no-op in Lovable preview / iframes).
registerServiceWorker();
