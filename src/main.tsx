import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalTapHaptics } from "./lib/haptics";

const markIosPwa = () => {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isAppleTouch = /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const isStandalone = nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  document.documentElement.classList.toggle("ios-device", isAppleTouch);
  document.documentElement.classList.toggle("ios-pwa", isAppleTouch && isStandalone);
};

markIosPwa();

createRoot(document.getElementById("root")!).render(<App />);

// Native-app-feel: tiny vibration on every interactive tap (touch only).
installGlobalTapHaptics();

/* ---------- PWA service worker registration ----------
 * vite-plugin-pwa generates /sw.js for the main PWA shell. We deliberately
 * skip registering it inside Lovable preview or iframe contexts (it would
 * cause stale content / navigation interference). The dedicated push
 * service worker at /sw-push.js is registered separately by the
 * usePushNotifications hook only when the user opts in.
 */
(function registerPwaSw() {
  if (typeof window === "undefined") return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovableproject-dev.com");

  if (!("serviceWorker" in navigator)) return;

  if (isPreviewHost || isInIframe) {
    // Clean up any previously-registered SWs in preview contexts.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        // Keep /sw-push.js so push notifications still work where supported,
        // but unregister the auto-update PWA shell to avoid stale caches.
        const url = r.active?.scriptURL || "";
        if (!url.endsWith("/sw-push.js")) r.unregister();
      });
    });
    return;
  }

  // Production: register the generated PWA service worker.
  window.addEventListener("load", () => {
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({ immediate: true });
      })
      .catch(() => { /* plugin not available */ });
  });
})();

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
