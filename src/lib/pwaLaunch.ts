export type AdminPwaKind = "seller-admin" | "master-admin";

const LAUNCH_INTENT_KEY = "bitez:pwa_launch_intent:v1";
const INTENT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type LaunchIntent = {
  kind: AdminPwaKind;
  savedAt: number;
};

type PwaHeadConfig = {
  manifest: string;
  title: string;
  theme: string;
  standalone: boolean;
  kind: AdminPwaKind | "user";
};

export function adminPwaKindForPath(pathname: string): AdminPwaKind | null {
  if (pathname.startsWith("/seller")) return "seller-admin";
  if (pathname.startsWith("/master-admin")) return "master-admin";
  return null;
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

export function adminHomeForKind(kind: AdminPwaKind, authenticated: boolean) {
  if (kind === "master-admin") return authenticated ? "/master-admin/overview" : "/master-admin/login";
  return authenticated ? "/seller/dashboard" : "/seller/login";
}

export function getStoredAdminLaunchKind(): AdminPwaKind | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAUNCH_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LaunchIntent;
    if ((parsed.kind !== "seller-admin" && parsed.kind !== "master-admin") || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > INTENT_MAX_AGE_MS) return null;
    return parsed.kind;
  } catch {
    return null;
  }
}

function configForPath(pathname: string): PwaHeadConfig {
  const kind = adminPwaKindForPath(pathname);
  if (kind === "master-admin") {
    return { manifest: "/manifest-admin.webmanifest", title: "Bitez Master Admin", theme: "#0A0A0F", standalone: true, kind };
  }
  if (kind === "seller-admin") {
    return { manifest: "/manifest-seller-admin.webmanifest", title: "Bitez Admin", theme: "#050505", standalone: true, kind };
  }
  return { manifest: "/manifest.webmanifest", title: "Bitez", theme: "#050505", standalone: false, kind: "user" };
}

function ensureMeta(name: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  return meta;
}

export function applyPwaHeadForPath(pathname = window.location.pathname) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const config = configForPath(pathname);

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.setAttribute("href", config.manifest);

  ensureMeta("theme-color").setAttribute("content", config.theme);
  ensureMeta("apple-mobile-web-app-title").setAttribute("content", config.title);
  ensureMeta("apple-mobile-web-app-capable").setAttribute("content", config.standalone ? "yes" : "no");
  ensureMeta("mobile-web-app-capable").setAttribute("content", config.standalone ? "yes" : "no");

  if (config.kind === "seller-admin" || config.kind === "master-admin") {
    try {
      window.localStorage.setItem(LAUNCH_INTENT_KEY, JSON.stringify({ kind: config.kind, savedAt: Date.now() }));
    } catch {
      /* ignore private-mode storage failures */
    }
  }
}