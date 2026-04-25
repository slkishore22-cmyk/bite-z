import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales } from "@/hooks/useSellerData";
import { SkeletonRow } from "@/components/seller/SkeletonRow";
import { EmptyState } from "@/components/seller/EmptyState";

type RangeKey = "today" | "week" | "month";

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("today");
  const { data, isLoading } = useSales(range);

  const peakLabel = useMemo(() => {
    if (data?.peakHour == null) return "—";
    const h = data.peakHour;
    const period = h < 12 ? "AM" : "PM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${period}`;
  }, [data?.peakHour]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <section className="flex items-start gap-3">
          <Link
            to="/seller"
            aria-label="Back"
            className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-extrabold tracking-tight">Sales Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track your canteen performance</p>

            <div className="mt-4 flex items-center gap-2">
              <div className="inline-flex rounded-full bg-secondary/70 p-1">
                {(["today", "week", "month"] as RangeKey[]).map((k) => {
                  const active = range === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setRange(k)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                        active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => navigate("/seller/sales/reports")}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bar_chart</span>
                Reports
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-muted-foreground">
            {range === "today" ? "TODAY'S SALES" : range === "week" ? "THIS WEEK" : "THIS MONTH"}
          </p>
          <p className="mt-1.5 text-4xl font-extrabold tracking-tight">
            {isLoading ? "—" : `₹${(data?.totalSales ?? 0).toLocaleString("en-IN")}`}
            <span className="ml-2 align-middle text-xs font-bold tracking-wide text-muted-foreground">INR</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLoading ? "—" : `${data?.orderCount ?? 0} delivered orders`}
          </p>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between">
            <h3 className="text-lg font-extrabold tracking-tight">Top Items</h3>
            <span className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
              {data?.items.length ?? 0} ITEMS
            </span>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <SkeletonRow count={3} />
            ) : !data?.items.length ? (
              <EmptyState
                icon="insights"
                title="No sales yet"
                description="Once orders are delivered, top items appear here."
              />
            ) : (
              <div className="space-y-3">
                {data.items.slice(0, 6).map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">🍽️</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold">{it.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {it.qty} sold • ₹{it.revenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-warning/15 text-warning">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>schedule</span>
            </div>
            <p className="mt-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">PEAK HOUR</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight">{peakLabel}</p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>star</span>
            </div>
            <p className="mt-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">TOP ITEM</p>
            <p className="mt-1 truncate text-xl font-extrabold tracking-tight">
              {data?.topItem ?? "—"}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesDashboard;