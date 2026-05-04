// Service-worker registration + offline state, guarded so it NEVER runs inside
// the Lovable preview iframe or on lovableproject.com hosts (which would cache
// the editor and break HMR).

const isPreviewHost = () => {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return (
    h.includes("lovableproject.com") ||
    h.includes("id-preview--") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Register the service worker on supported, production-only contexts.
 * Also actively unregisters any leftover SW when running inside preview/iframe
 * so a published-then-previewed app doesn't ship stale caches into the editor.
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (isPreviewHost() || isInIframe()) {
    // Clean up any previously registered SW in preview contexts.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox("/sw.js", { scope: "/" });
    wb.addEventListener("waiting", () => wb.messageSkipWaiting());
    wb.addEventListener("controlling", () => window.location.reload());
    await wb.register();
  } catch {
    /* SW registration failed — app still works, just no offline. */
  }
}

/* ---------------- Offline state ---------------- */

export type OfflineListener = (offline: boolean) => void;

const listeners = new Set<OfflineListener>();

export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function subscribeOffline(cb: OfflineListener) {
  if (typeof window === "undefined") return () => {};
  const fire = () => cb(isOffline());
  listeners.add(cb);
  window.addEventListener("online", fire);
  window.addEventListener("offline", fire);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("online", fire);
    window.removeEventListener("offline", fire);
  };
}