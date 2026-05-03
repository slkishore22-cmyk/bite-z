import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Shell from "../components/Shell";
import { db } from "../db";
import { CHART_COLORS, axisStyle, daysAgoISO, inr, todayISO, tooltipStyle } from "../format";

type Seller = { id: string; canteen_name: string; is_active: boolean; is_suspended: boolean };
type Sale = { seller_id: string; date: string; total_orders: number; total_revenue: number };

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeUsersToday, setActiveUsersToday] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: ss }, { data: ua }] = await Promise.all([
        db.from("sellers").select("id, canteen_name, is_active, is_suspended"),
        db.from("seller_sales").select("seller_id, date, total_orders, total_revenue").gte("date", daysAgoISO(30)),
        db.from("user_analytics").select("user_id, created_at").gte("created_at", todayISO()),
      ]);
      setSellers(s ?? []);
      setSales(ss ?? []);
      const uniq = new Set((ua ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean));
      setActiveUsersToday(uniq.size);
      setLoading(false);
    })();
  }, []);

  const today = todayISO();
  const yesterday = daysAgoISO(1);
  const todayRows = sales.filter((s) => s.date === today);
  const ydayRows = sales.filter((s) => s.date === yesterday);
  const gmvToday = todayRows.reduce((a, r) => a + Number(r.total_revenue || 0), 0);
  const gmvYday = ydayRows.reduce((a, r) => a + Number(r.total_revenue || 0), 0);
  const ordersToday = todayRows.reduce((a, r) => a + Number(r.total_orders || 0), 0);
  const activeSellers = sellers.filter((s) => s.is_active && !s.is_suspended).length;

  const change = gmvYday > 0 ? ((gmvToday - gmvYday) / gmvYday) * 100 : null;

  // Build per-day per-seller line chart data (last 30 days)
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) dates.push(daysAgoISO(i));
  const sellerById = Object.fromEntries(sellers.map((s) => [s.id, s.canteen_name]));
  const trendData = dates.map((d) => {
    const row: Record<string, string | number> = { date: d.slice(5) };
    sellers.forEach((s) => { row[s.canteen_name] = 0; });
    sales.filter((r) => r.date === d).forEach((r) => {
      const k = sellerById[r.seller_id] ?? "?";
      row[k] = Number(row[k] ?? 0) + Number(r.total_revenue || 0);
    });
    return row;
  });

  const top5 = [...sellers]
    .map((s) => ({
      name: s.canteen_name,
      revenue: todayRows.filter((r) => r.seller_id === s.id).reduce((a, r) => a + Number(r.total_revenue || 0), 0),
    }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const distribution = sellers.map((s) => ({
    name: s.canteen_name,
    value: todayRows.filter((r) => r.seller_id === s.id).reduce((a, r) => a + Number(r.total_orders || 0), 0),
  })).filter((r) => r.value > 0);

  // Alerts
  const alerts: string[] = [];
  sellers.forEach((s) => {
    if (!s.is_active || s.is_suspended) return;
    const t = todayRows.find((r) => r.seller_id === s.id);
    if (!t || t.total_orders === 0) alerts.push(`⚠ ${s.canteen_name} — no sales today`);
    const last3 = sales.filter((r) => r.seller_id === s.id && r.date >= daysAgoISO(3));
    if (last3.length === 0) alerts.push(`⚠ ${s.canteen_name} — inactive 3 days`);
  });

  return (
    <Shell>
      {loading ? (
        <div className="ma-grid-stats">
          {[0,1,2,3].map((i) => <div key={i} className="ma-skeleton" style={{ height: 110 }} />)}
        </div>
      ) : (
        <>
          <div className="ma-grid-stats">
            <StatCard icon="payments" tone="#2563EB" value={inr(gmvToday)} label="Gross Merchandise Value · Today"
              sub={change == null ? "no data yesterday" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}% vs yesterday`}
              subColor={change == null ? "#6B7280" : change >= 0 ? "#22C55E" : "#EF4444"} />
            <StatCard icon="store" tone="#22C55E" value={String(activeSellers)} label="Active canteens" sub={`${sellers.length} total`} />
            <StatCard icon="shopping_bag" tone="#F59E0B" value={String(ordersToday)} label="Orders across all canteens" />
            <StatCard icon="group" tone="#8B5CF6" value={String(activeUsersToday)} label="Unique users active today" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 16 }} className="ma-overview-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ma-card">
                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ma-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue trend (30 days)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="#1E1E2E" />
                    <XAxis dataKey="date" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
                    {sellers.map((s, i) => (
                      <Line key={s.id} type="monotone" dataKey={s.canteen_name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="ma-grid-2">
                <div className="ma-card">
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ma-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top 5 sellers today</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={top5} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid stroke="#1E1E2E" />
                      <XAxis type="number" tick={axisStyle} />
                      <YAxis dataKey="name" type="category" tick={axisStyle} width={100} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="ma-card">
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ma-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order distribution today</h3>
                  {distribution.length === 0 ? (
                    <div className="ma-empty">No orders yet today</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                          {distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "var(--ma-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Alerts</h3>
              {alerts.length === 0 ? (
                <div className="ma-card" style={{ borderColor: "#1E3D1E", background: "#0A1A0A", color: "#86EFAC" }}>
                  All canteens healthy ✓
                </div>
              ) : alerts.map((a, i) => (
                <div key={i} className="ma-card" style={{ background: "#1A0A0A", borderColor: "#3D1515", padding: 14, fontSize: 13 }}>
                  {a}
                </div>
              ))}
            </aside>
          </div>
        </>
      )}
    </Shell>
  );
}

function StatCard({ icon, tone, value, label, sub, subColor }: {
  icon: string; tone: string; value: string; label: string; sub?: string; subColor?: string;
}) {
  return (
    <div className="ma-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="ma-stat-icon" style={{ background: `${tone}22`, color: tone }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--ma-text-2)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: subColor ?? "var(--ma-text-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}