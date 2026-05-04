import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalTapHaptics } from "./lib/haptics";

createRoot(document.getElementById("root")!).render(<App />);

// Native-app-feel: tiny vibration on every interactive tap (touch only).
installGlobalTapHaptics();
