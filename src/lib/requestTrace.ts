/**
 * End-to-end request tracing for Supabase calls.
 *
 * - Generates a per-operation `requestId` that propagates with each fetch via
 *   the `X-Bitez-Request-Id` header.
 * - Patches `window.fetch` (once) to capture every PostgREST / Edge Function
 *   call: method, table, filters, status, duration, row count, and the RLS
 *   role the request ran under (Authorization header type).
 * - Stores a bounded ring buffer in-memory + localStorage so the admin app
 *   can inspect "which query produced this row" after the fact.
 *
 * Used by:
 *   - src/main.tsx (boot — installs the patch)
 *   - src/master-admin/pages/Traces.tsx (admin viewer)
 *
 * To attach a custom requestId to a logical operation, call:
 *   const id = beginTrace("admin:overview");  // returns the requestId
 *   ... your supabase queries ...
 *   endTrace(id);
 * Any fetch executed while the trace is "active" is tagged with that id.
 */

export type TraceEntry = {
  requestId: string;
  label: string | null;        // logical operation label, when known
  app: "admin" | "seller" | "user" | "unknown";
  method: string;
  url: string;
  table: string | null;        // parsed PostgREST table, when applicable
  fn: string | null;           // parsed Edge Function name, when applicable
  filters: string | null;      // raw querystring (filters, select, order)
  status: number;
  ok: boolean;
  durationMs: number;
  rowCount: number | null;     // best-effort parsed from response body
  role: "anon" | "authenticated" | "service-role" | "unknown";
  rlsHint: string | null;      // surfaced error from PostgREST (RLS msg etc.)
  startedAt: number;
  // truncated response sample, for "did this query return the dummy row?"
  sample: unknown;
};

const STORAGE_KEY = "bitez:trace:log";
const MAX_ENTRIES = 200;
const EVENT = "bitez:trace:change";

let buffer: TraceEntry[] = [];
let installed = false;

// Stack of active labelled traces. The top entry wins when tagging requests.
const activeStack: Array<{ id: string; label: string }> = [];

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `req_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `req_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function currentApp(): TraceEntry["app"] {
  if (typeof window === "undefined") return "unknown";
  const p = window.location.pathname;
  if (p.startsWith("/master-admin")) return "admin";
  if (p.startsWith("/seller")) return "seller";
  if (p.startsWith("/app") || p === "/") return "user";
  return "unknown";
}

function loadFromStorage(): TraceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buffer.slice(-MAX_ENTRIES)),
    );
  } catch {
    /* quota — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

function parseUrl(url: string): { table: string | null; fn: string | null; filters: string | null } {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://x");
    const path = u.pathname;
    // PostgREST: /rest/v1/<table>
    const restMatch = path.match(/\/rest\/v1\/([^/?]+)/);
    if (restMatch) {
      return { table: restMatch[1], fn: null, filters: u.search.replace(/^\?/, "") || null };
    }
    // Edge function: /functions/v1/<name>
    const fnMatch = path.match(/\/functions\/v1\/([^/?]+)/);
    if (fnMatch) {
      return { table: null, fn: fnMatch[1], filters: u.search.replace(/^\?/, "") || null };
    }
  } catch {
    /* ignore */
  }
  return { table: null, fn: null, filters: null };
}

function detectRole(authHeader: string | null): TraceEntry["role"] {
  if (!authHeader) return "unknown";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    const role = payload?.role;
    if (role === "service_role") return "service-role";
    if (role === "authenticated") return "authenticated";
    if (role === "anon") return "anon";
  } catch {
    /* not a JWT */
  }
  return "unknown";
}

function safeSample(text: string): unknown {
  if (!text) return null;
  const clipped = text.length > 2000 ? text.slice(0, 2000) + "…[truncated]" : text;
  try {
    return JSON.parse(clipped);
  } catch {
    return clipped;
  }
}

function rowCountOf(sample: unknown): number | null {
  if (Array.isArray(sample)) return sample.length;
  return null;
}

export function beginTrace(label: string): string {
  const id = genId();
  activeStack.push({ id, label });
  return id;
}

export function endTrace(id: string): void {
  const idx = activeStack.findIndex((t) => t.id === id);
  if (idx >= 0) activeStack.splice(idx, 1);
}

export function withTrace<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const id = beginTrace(label);
  return Promise.resolve(fn()).finally(() => endTrace(id));
}

export function getTraces(): TraceEntry[] {
  return [...buffer].reverse();
}

export function clearTraces(): void {
  buffer = [];
  persist();
}

export function subscribeTraces(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Install the global fetch interceptor exactly once. Safe to call repeatedly. */
export function installRequestTracing(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  buffer = loadFromStorage();

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
    const method = (init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    // Only trace Supabase traffic — keep noise out of the log.
    const isSupabase =
      url.includes("/rest/v1/") ||
      url.includes("/functions/v1/") ||
      url.includes(".supabase.co") ||
      url.includes(".supabase.in");
    if (!isSupabase) return originalFetch(input, init);

    const active = activeStack[activeStack.length - 1];
    const requestId = active?.id ?? genId();
    const label = active?.label ?? null;

    // Inject the X-Bitez-Request-Id header so the same id flows through to
    // Edge Functions, where it can be logged on the server side too.
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set("X-Bitez-Request-Id", requestId);

    const nextInit: RequestInit = { ...init, headers };
    const startedAt = Date.now();
    let status = 0;
    let ok = false;
    let sample: unknown = null;
    let rlsHint: string | null = null;

    try {
      const response = await originalFetch(input, nextInit);
      status = response.status;
      ok = response.ok;

      // Clone so the caller can still read the body.
      try {
        const text = await response.clone().text();
        sample = safeSample(text);
        if (!ok && sample && typeof sample === "object") {
          const obj = sample as Record<string, unknown>;
          const msg = String(obj.message ?? obj.error ?? "");
          if (msg) rlsHint = msg;
        }
      } catch {
        /* opaque body — skip */
      }
      return response;
    } catch (err) {
      rlsHint = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const parsed = parseUrl(url);
      const role = detectRole(headers.get("Authorization"));
      const entry: TraceEntry = {
        requestId,
        label,
        app: currentApp(),
        method,
        url,
        table: parsed.table,
        fn: parsed.fn,
        filters: parsed.filters,
        status,
        ok,
        durationMs: Date.now() - startedAt,
        rowCount: rowCountOf(sample),
        role,
        rlsHint,
        startedAt,
        sample,
      };
      buffer.push(entry);
      if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
      persist();
    }
  };
}
