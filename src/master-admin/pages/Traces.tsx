import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import {
  clearTraces,
  getTraces,
  subscribeTraces,
  type TraceEntry,
} from "@/lib/requestTrace";

type Filter = "all" | "errors" | "rls" | "admin" | "seller" | "user";

function badge(role: TraceEntry["role"]) {
  const map: Record<TraceEntry["role"], string> = {
    "anon": "#64748B",
    "authenticated": "#2563EB",
    "service-role": "#DC2626",
    "unknown": "#94A3B8",
  };
  return map[role];
}

function isRlsLikely(t: TraceEntry): boolean {
  if (t.ok) return false;
  const m = (t.rlsHint || "").toLowerCase();
  return (
    t.status === 401 ||
    t.status === 403 ||
    m.includes("rls") ||
    m.includes("row-level security") ||
    m.includes("policy") ||
    m.includes("permission")
  );
}

export default function Traces() {
  const [traces, setTraces] = useState<TraceEntry[]>(() => getTraces());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => subscribeTraces(() => setTraces(getTraces())), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return traces.filter((t) => {
      if (filter === "errors" && t.ok) return false;
      if (filter === "rls" && !isRlsLikely(t)) return false;
      if (filter === "admin" && t.app !== "admin") return false;
      if (filter === "seller" && t.app !== "seller") return false;
      if (filter === "user" && t.app !== "user") return false;
      if (!q) return true;
      const hay = [
        t.requestId, t.label ?? "", t.table ?? "", t.fn ?? "",
        t.filters ?? "", t.rlsHint ?? "", t.url,
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [traces, filter, query]);

  const selected = useMemo(
    () => filtered.find((t) => `${t.requestId}-${t.startedAt}` === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  const groupedByRequestId = useMemo(() => {
    if (!selected) return [] as TraceEntry[];
    return traces.filter((t) => t.requestId === selected.requestId).sort((a, b) => a.startedAt - b.startedAt);
  }, [traces, selected]);

  return (
    <Shell>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Trace Inspector</h2>
            <p style={{ color: "var(--ma-text-2)", margin: "4px 0 0", fontSize: 13 }}>
              Every Supabase call tagged with a requestId. Inspect which query / RLS rule produced wrong or dummy data.
            </p>
          </div>
          <button
            onClick={() => { clearTraces(); setSelectedId(null); }}
            className="ma-btn ma-btn-ghost"
            style={{ padding: "6px 14px" }}
          >
            Clear log
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {(["all", "errors", "rls", "admin", "seller", "user"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`ma-pill ${filter === f ? "ma-pill-blue" : ""}`}
              style={{ border: 0, cursor: "pointer", textTransform: "capitalize" }}
            >
              {f}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search table, requestId, filter, error…"
            style={{
              flex: 1, minWidth: 240, padding: "6px 12px", borderRadius: 8,
              border: "1px solid var(--ma-border)", background: "var(--ma-surface)",
              color: "var(--ma-text-1)", fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>
          {/* List */}
          <div style={{
            background: "var(--ma-surface)", border: "1px solid var(--ma-border)",
            borderRadius: 12, overflow: "hidden", maxHeight: "70vh", overflowY: "auto",
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, color: "var(--ma-text-3)", fontSize: 13 }}>
                No traces match. Interact with any app — calls will appear here.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--ma-surface-2)", textAlign: "left", color: "var(--ma-text-2)" }}>
                    <th style={{ padding: 8 }}>Time</th>
                    <th style={{ padding: 8 }}>App</th>
                    <th style={{ padding: 8 }}>Table / Fn</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Rows</th>
                    <th style={{ padding: 8 }}>ms</th>
                    <th style={{ padding: 8 }}>requestId</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const key = `${t.requestId}-${t.startedAt}`;
                    const isSel = selected && key === `${selected.requestId}-${selected.startedAt}`;
                    return (
                      <tr
                        key={key}
                        onClick={() => setSelectedId(key)}
                        style={{
                          cursor: "pointer",
                          background: isSel ? "rgba(37,99,235,0.12)" : "transparent",
                          borderTop: "1px solid var(--ma-border)",
                        }}
                      >
                        <td style={{ padding: 8, fontVariantNumeric: "tabular-nums" }}>
                          {new Date(t.startedAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: 8 }}>{t.app}</td>
                        <td style={{ padding: 8, fontFamily: "monospace" }}>
                          {t.table ?? (t.fn ? `fn:${t.fn}` : "—")}
                        </td>
                        <td style={{ padding: 8, color: t.ok ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                          {t.method} {t.status || "—"}
                          {isRlsLikely(t) && (
                            <span style={{ marginLeft: 6, color: "#DC2626" }} title="Likely RLS / permission failure">RLS</span>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>{t.rowCount ?? "—"}</td>
                        <td style={{ padding: 8 }}>{t.durationMs}</td>
                        <td style={{ padding: 8, fontFamily: "monospace", color: "var(--ma-text-3)" }}>
                          {t.requestId.slice(0, 14)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail */}
          <div style={{
            background: "var(--ma-surface)", border: "1px solid var(--ma-border)",
            borderRadius: 12, padding: 16, maxHeight: "70vh", overflowY: "auto",
          }}>
            {!selected ? (
              <div style={{ color: "var(--ma-text-3)", fontSize: 13 }}>Select a row to inspect.</div>
            ) : (
              <div style={{ fontSize: 13 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 999,
                    background: badge(selected.role), color: "white", fontWeight: 700,
                  }}>
                    {selected.role}
                  </span>
                  <code style={{ fontSize: 12 }}>{selected.requestId}</code>
                </div>
                {selected.label && (
                  <div style={{ marginBottom: 6 }}>
                    <strong>Label:</strong> <code>{selected.label}</code>
                  </div>
                )}
                <div style={{ marginBottom: 6 }}>
                  <strong>{selected.method}</strong>{" "}
                  {selected.table ? <code>{selected.table}</code> : selected.fn ? <code>fn:{selected.fn}</code> : null}{" "}
                  → <span style={{ color: selected.ok ? "#16A34A" : "#DC2626" }}>{selected.status}</span>
                </div>
                {selected.filters && (
                  <details style={{ marginBottom: 8 }}>
                    <summary style={{ cursor: "pointer", color: "var(--ma-text-2)" }}>Filters / select</summary>
                    <pre style={{
                      whiteSpace: "pre-wrap", wordBreak: "break-all",
                      background: "var(--ma-surface-2)", padding: 8, borderRadius: 6, marginTop: 6,
                    }}>
                      {decodeURIComponent(selected.filters)}
                    </pre>
                  </details>
                )}
                {selected.rlsHint && (
                  <div style={{
                    background: "rgba(220,38,38,0.1)", color: "#DC2626",
                    padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 12,
                  }}>
                    <strong>{isRlsLikely(selected) ? "RLS / permission hint:" : "Error:"}</strong> {selected.rlsHint}
                  </div>
                )}
                <details open style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer", color: "var(--ma-text-2)" }}>
                    Response sample {selected.rowCount != null ? `(${selected.rowCount} rows)` : ""}
                  </summary>
                  <pre style={{
                    maxHeight: 240, overflow: "auto",
                    background: "var(--ma-surface-2)", padding: 8, borderRadius: 6, marginTop: 6,
                    fontSize: 11,
                  }}>
                    {JSON.stringify(selected.sample, null, 2)}
                  </pre>
                </details>
                {groupedByRequestId.length > 1 && (
                  <details>
                    <summary style={{ cursor: "pointer", color: "var(--ma-text-2)" }}>
                      {groupedByRequestId.length} calls share this requestId
                    </summary>
                    <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                      {groupedByRequestId.map((t, i) => (
                        <li key={i} style={{ fontFamily: "monospace", fontSize: 11 }}>
                          {t.method} {t.table ?? t.fn ?? "—"} → {t.status} ({t.durationMs}ms)
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}