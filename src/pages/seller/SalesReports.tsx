import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CategoryItem = { name: string; qty: number };
type Category = {
  key: string;
  icon: string;
  name: string;
  itemsSold: number;
  revenue: number;
  items: CategoryItem[];
};

const categories: Category[] = [
  {
    key: "food",
    icon: "restaurant",
    name: "Food",
    itemsSold: 1240,
    revenue: 42100,
    items: [
      { name: "Signature Truffle Pasta", qty: 450 },
      { name: "Midnight Burger", qty: 380 },
    ],
  },
  {
    key: "snacks",
    icon: "bakery_dining",
    name: "Snacks",
    itemsSold: 890,
    revenue: 18400,
    items: [
      { name: "Masala Fries", qty: 410 },
      { name: "Veg Puff", qty: 480 },
    ],
  },
  {
    key: "drinks",
    icon: "local_bar",
    name: "Drinks",
    itemsSold: 2100,
    revenue: 23700,
    items: [
      { name: "Iced Peach Tea", qty: 1100 },
      { name: "Cold Coffee", qty: 1000 },
    ],
  },
];

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const formatINRShort = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

const SalesReports = () => {
  const [startDate, setStartDate] = useState<Date>(new Date("2024-10-01"));
  const [endDate, setEndDate] = useState<Date>(new Date("2024-10-31"));
  const [openKey, setOpenKey] = useState<string | null>("food");

  const totalSales = 84200;
  const totalOrders = 3421;
  const avgPerDay = useMemo(() => 24600, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            to="/seller/sales"
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Sales Reports</h1>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Active View: Analytics
            </p>
          </div>
        </header>

        {/* Date range */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <DateField label="Start Date" value={startDate} onChange={setStartDate} />
          <DateField label="End Date" value={endDate} onChange={setEndDate} />
        </section>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-glow transition hover:bg-primary/90"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            insights
          </span>
          View Report
        </button>

        {/* Totals */}
        <section className="mt-6 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
          <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
            TOTAL SALES
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-4xl font-extrabold tracking-tight">{formatINR(totalSales)}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
              +12.4% ↑
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/50 px-4 py-3">
              <p className="text-lg font-extrabold">{totalOrders.toLocaleString("en-IN")}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Orders
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/50 px-4 py-3">
              <p className="text-lg font-extrabold">{formatINRShort(avgPerDay)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Avg / Day
              </p>
            </div>
          </div>
        </section>

        {/* Category breakdown */}
        <section className="mt-7">
          <h2 className="text-lg font-extrabold tracking-tight">Category Breakdown</h2>

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
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {cat.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">{cat.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {cat.itemsSold.toLocaleString("en-IN")} items sold
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      <span className="text-base font-extrabold text-primary">
                        {formatINR(cat.revenue)}
                      </span>
                      <span
                        className="material-symbols-outlined text-muted-foreground transition-transform"
                        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        {open ? "expand_more" : "chevron_right"}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-2 border-t border-border/60 bg-secondary/30 p-3">
                      {cat.items.map((it) => (
                        <div
                          key={it.name}
                          className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5"
                        >
                          <span className="truncate text-sm font-semibold">{it.name}</span>
                          <span className="text-sm font-bold text-primary">
                            {it.qty} qty
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-muted-foreground">
          <a href="#" className="transition hover:text-foreground">Support</a>
          <span className="opacity-40">•</span>
          <a href="#" className="transition hover:text-foreground">Privacy Policy</a>
          <span className="opacity-40">•</span>
          <a href="#" className="transition hover:text-foreground">System Status</a>
        </footer>
      </div>
    </div>
  );
};

export default SalesReports;

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
};

const DateField = ({ label, value, onChange }: DateFieldProps) => (
  <div>
    <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
      {label.toUpperCase()}
    </p>
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-full border border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold transition hover:border-primary/40"
          )}
        >
          <span>{format(value, "dd MMM yyyy")}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);
