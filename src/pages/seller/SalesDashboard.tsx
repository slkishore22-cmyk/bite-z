import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type RangeKey = "today" | "week" | "month";

type CategoryItem = { name: string; sold: number };
type Category = {
  key: string;
  emoji: string;
  name: string;
  totalSold: number;
  items: CategoryItem[];
};

const categories: Category[] = [
  {
    key: "food",
    emoji: "🍛",
    name: "Food",
    totalSold: 142,
    items: [
      { name: "Signature Cheeseburger", sold: 62 },
      { name: "Truffle Parmesan Fries", sold: 80 },
    ],
  },
  {
    key: "snacks",
    emoji: "🍟",
    name: "Snacks",
    totalSold: 85,
    items: [
      { name: "Masala Fries", sold: 40 },
      { name: "Veg Puff", sold: 45 },
    ],
  },
  {
    key: "drinks",
    emoji: "🥤",
    name: "Drinks",
    totalSold: 98,
    items: [
      { name: "Iced Peach Tea", sold: 55 },
      { name: "Cold Coffee", sold: 43 },
    ],
  },
];

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("today");
  const [openKey, setOpenKey] = useState<string | null>("food");

  const totalCats = categories.length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        {/* Title */}
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
          <p className="mt-1 text-sm text-muted-foreground">
            Track your canteen performance
          </p>

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
                    {active && (
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => navigate("/seller/sales/reports")}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition hover:bg-secondary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                bar_chart
              </span>
              View Reports
            </button>
          </div>
          </div>
        </section>

        {/* Sales card */}
        <section className="mt-5 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                trending_up
              </span>
              +8.5%
            </span>
          </div>
          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-muted-foreground">
            {range === "today" ? "TODAY'S SALES" : range === "week" ? "THIS WEEK" : "THIS MONTH"}
          </p>
          <p className="mt-1.5 text-4xl font-extrabold tracking-tight">
            ₹12,450
            <span className="ml-2 align-middle text-xs font-bold tracking-wide text-muted-foreground">
              INR
            </span>
          </p>
        </section>

        {/* Sales by category */}
        <section className="mt-7">
          <div className="flex items-end justify-between">
            <h3 className="text-lg font-extrabold tracking-tight">Sales by Category</h3>
            <span className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
              {totalCats} CATEGORIES
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {categories.map((cat) => {
              const open = openKey === cat.key;
              return (
                <div
                  key={cat.key}
                  className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card"
                >
                  <button
                    onClick={() => setOpenKey(open ? null : cat.key)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                    aria-expanded={open}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
                      {cat.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">{cat.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {cat.totalSold} items sold
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-muted-foreground transition-transform"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-border/60 bg-secondary/30 p-3 space-y-2">
                      {cat.items.map((it) => (
                        <div
                          key={it.name}
                          className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5"
                        >
                          <span className="truncate text-sm font-semibold">{it.name}</span>
                          <span className="text-sm font-bold text-primary">{it.sold} sold</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom stats */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-warning/15 text-warning">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                schedule
              </span>
            </div>
            <p className="mt-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              PEAK HOUR
            </p>
            <p className="mt-1 text-xl font-extrabold tracking-tight">1:30 PM</p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                star
              </span>
            </div>
            <p className="mt-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              TOP ITEM
            </p>
            <p className="mt-1 text-xl font-extrabold tracking-tight">Burger</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesDashboard;
