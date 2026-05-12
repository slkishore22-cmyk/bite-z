import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalTapHaptics } from "./lib/haptics";

createRoot(document.getElementById("root")!).render(<App />);

// Native-app-feel: tiny vibration on every interactive tap (touch only).
installGlobalTapHaptics();

/* ---------- VisualViewport-driven app height ----------
 * iOS Safari doesn't shrink 100dvh when the keyboard opens, so the bottom
 * nav can end up under the keyboard. We expose --app-vh that always equals
 * the *visible* viewport, computed from window.visualViewport when present
 * and falling back to window.innerHeight. This is the most reliable strategy
 * across iOS Safari, Chrome Android, and standalone PWAs.
 */
(function installAppViewport() {
  if (typeof window === "undefined") return;
  const vv = window.visualViewport;
  const apply = () => {
    const h = vv?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-vh", `${h}px`);
  };
  apply();
  if (vv) {
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
  }
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
})();
